import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {
  ensureParentDirectory,
  loadEnvironmentFile,
  parseArgs,
  requireValue,
} from './migration-utils.mjs';

const args = parseArgs();
loadEnvironmentFile(args);

function booleanValue(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function storageConfig(prefix, fallbackPrefix) {
  const fallback = fallbackPrefix ? `${fallbackPrefix}_` : '';
  const value = (name) => process.env[`${prefix}_${name}`] || process.env[`${fallback}${name}`];
  const accessKeyId = value('ACCESS_KEY_ID');
  const secretAccessKey = value('SECRET_ACCESS_KEY');
  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error(`${prefix}_ACCESS_KEY_ID 与 ${prefix}_SECRET_ACCESS_KEY 必须同时设置`);
  }
  return {
    bucket: requireValue(value('BUCKET'), `${prefix}_BUCKET`),
    client: new S3Client({
      region: value('REGION') || 'us-east-1',
      endpoint: value('ENDPOINT') || undefined,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      forcePathStyle: booleanValue(value('FORCE_PATH_STYLE')),
    }),
  };
}

async function listObjects(client, bucket, prefix) {
  const objects = [];
  let continuationToken;
  do {
    const result = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      ContinuationToken: continuationToken,
    }));
    for (const item of result.Contents || []) {
      if (item.Key) {
        objects.push({ key: item.Key, size: item.Size || 0, etag: item.ETag || null });
      }
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

async function targetObjectSize(client, bucket, key) {
  try {
    const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return result.ContentLength ?? null;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === 'NotFound' || error?.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

const source = storageConfig('SOURCE_S3');
const target = storageConfig('TARGET_S3', 'S3');
const sourcePrefix = args.get('source-prefix', process.env.SOURCE_S3_PREFIX || '');
const targetPrefix = args.get('target-prefix', process.env.TARGET_S3_PREFIX || '');
const overwrite = args.has('overwrite');
const dryRun = args.has('dry-run');
const verify = args.has('verify');
const concurrency = Math.max(1, Number.parseInt(args.get('concurrency', process.env.STORAGE_MIGRATION_CONCURRENCY || '3'), 10));
const reportFile = resolve(args.get('report', 'migration-artifacts/storage-transfer.json'));

const sourceObjects = await listObjects(source.client, source.bucket, sourcePrefix);
console.log(`源对象数量: ${sourceObjects.length}`);

let cursor = 0;
let copied = 0;
let skipped = 0;

async function worker() {
  while (true) {
    const index = cursor;
    cursor += 1;
    if (index >= sourceObjects.length) {
      return;
    }

    const object = sourceObjects[index];
    const relativeKey = object.key.slice(sourcePrefix.length).replace(/^\//, '');
    const targetKey = `${targetPrefix}${targetPrefix && relativeKey ? '/' : ''}${relativeKey}`.replace(/^\//, '');
    const existingSize = await targetObjectSize(target.client, target.bucket, targetKey);
    if (!overwrite && existingSize === object.size) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      const sourceObject = await source.client.send(new GetObjectCommand({
        Bucket: source.bucket,
        Key: object.key,
      }));
      if (!sourceObject.Body) {
        throw new Error(`无法读取源对象: ${object.key}`);
      }
      const upload = new Upload({
        client: target.client,
        params: {
          Bucket: target.bucket,
          Key: targetKey,
          Body: sourceObject.Body,
          ContentType: sourceObject.ContentType,
          ContentDisposition: sourceObject.ContentDisposition,
          ContentEncoding: sourceObject.ContentEncoding,
          CacheControl: sourceObject.CacheControl,
          Metadata: sourceObject.Metadata,
        },
      });
      await upload.done();
    }

    copied += 1;
    if ((copied + skipped) % 50 === 0 || copied + skipped === sourceObjects.length) {
      console.log(`进度: ${copied + skipped}/${sourceObjects.length}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

let mismatches = [];
if (verify && !dryRun) {
  const targetObjects = await listObjects(target.client, target.bucket, targetPrefix);
  const targetSizes = new Map(targetObjects.map((item) => [item.key, item.size]));
  mismatches = sourceObjects.flatMap((object) => {
    const relativeKey = object.key.slice(sourcePrefix.length).replace(/^\//, '');
    const targetKey = `${targetPrefix}${targetPrefix && relativeKey ? '/' : ''}${relativeKey}`.replace(/^\//, '');
    const targetSize = targetSizes.get(targetKey);
    return targetSize === object.size ? [] : [{ sourceKey: object.key, targetKey, sourceSize: object.size, targetSize }];
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  sourceBucket: source.bucket,
  targetBucket: target.bucket,
  sourcePrefix,
  targetPrefix,
  total: sourceObjects.length,
  copied,
  skipped,
  mismatches,
};
ensureParentDirectory(reportFile);
writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(`复制: ${copied}，跳过: ${skipped}，校验不一致: ${mismatches.length}`);
console.log(`迁移报告: ${reportFile}`);
if (mismatches.length > 0) {
  process.exitCode = 1;
}
