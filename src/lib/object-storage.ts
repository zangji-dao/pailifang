import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface UploadFileInput {
  fileContent: Buffer;
  fileName: string;
  contentType?: string;
}

interface PresignedUrlInput {
  key: string;
  expireTime?: number;
}

interface StorageConfiguration {
  bucket: string;
  client: S3Client;
  presignClient: S3Client;
}

function getStorageConfiguration(): StorageConfiguration {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT;
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket) {
    throw new Error('对象存储配置缺失，请设置 S3_BUCKET');
  }

  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error('S3_ACCESS_KEY_ID 和 S3_SECRET_ACCESS_KEY 必须同时设置');
  }

  const clientOptions = {
      region,
      credentials: accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  };

  return {
    bucket,
    client: new S3Client({
      ...clientOptions,
      endpoint: endpoint || undefined,
    }),
    presignClient: new S3Client({
      ...clientOptions,
      endpoint: publicEndpoint || endpoint || undefined,
    }),
  };
}

export class ObjectStorageClient {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly presignClient: S3Client;

  constructor() {
    const configuration = getStorageConfiguration();
    this.bucket = configuration.bucket;
    this.client = configuration.client;
    this.presignClient = configuration.presignClient;
  }

  async uploadFile(input: UploadFileInput): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.fileName,
      Body: input.fileContent,
      ContentType: input.contentType,
    }));

    return input.fileName;
  }

  async generatePresignedUrl(input: PresignedUrlInput): Promise<string> {
    return getSignedUrl(
      this.presignClient,
      new GetObjectCommand({ Bucket: this.bucket, Key: input.key }),
      { expiresIn: input.expireTime || 3600 },
    );
  }

  async readFile({ fileKey }: { fileKey: string }): Promise<Buffer> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    }));

    if (!response.Body) {
      throw new Error(`文件不存在: ${fileKey}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async deleteFile({ fileKey }: { fileKey: string }): Promise<boolean> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    }));
    return true;
  }

  async fileExists({ fileKey }: { fileKey: string }): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      }));
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(options: {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  } = {}) {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options.prefix,
      MaxKeys: options.maxKeys || 100,
      ContinuationToken: options.continuationToken,
    }));

    return {
      keys: (response.Contents || []).flatMap((item) => item.Key ? [item.Key] : []),
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
    };
  }
}

let storageClient: ObjectStorageClient | null = null;

export function getObjectStorage(): ObjectStorageClient {
  if (!storageClient) {
    storageClient = new ObjectStorageClient();
  }
  return storageClient;
}
