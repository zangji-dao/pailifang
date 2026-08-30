/**
 * S3 兼容对象存储服务
 * 支持 Lighthouse 轻量对象存储
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageService,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  DownloadResult,
  ListOptions,
  ListResult,
  FileInfo,
  generateUniqueKey,
  getMimeType,
} from './types';

/**
 * S3 存储服务实现
 */
export class S3StorageService implements IStorageService {
  private client: S3Client;
  private presignClient: S3Client;
  private bucket: string;

  constructor(config: {
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket: string;
    region: string;
    endpoint?: string;
    publicEndpoint?: string;
    forcePathStyle?: boolean;
  }) {
    this.bucket = config.bucket;

    const clientOptions = {
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      forcePathStyle: config.forcePathStyle || false,
    };

    this.client = new S3Client({
      ...clientOptions,
      endpoint: config.endpoint,
    });
    this.presignClient = new S3Client({
      ...clientOptions,
      endpoint: config.publicEndpoint || config.endpoint,
    });
  }

  /**
   * 上传文件
   */
  async upload(
    buffer: Buffer,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const key = options?.key || generateUniqueKey(filename);
    const contentType = options?.contentType || getMimeType(filename);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: options?.metadata,
    });

    await this.client.send(command);

    // 生成访问 URL
    const url = await this.getDownloadUrl(key);

    return {
      key,
      url: url.url,
      size: buffer.length,
    };
  }

  /**
   * 获取下载链接（临时签名 URL）
   */
  async getDownloadUrl(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    const expiresIn = options?.expiresIn || 3600; // 默认 1 小时

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.presignClient, command, { expiresIn });

    return {
      key,
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * 获取文件内容
   */
  async getBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // 将流转换为 Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  /**
   * 获取文件信息
   */
  async getInfo(key: string): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        filename: key.split('/').pop() || key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified,
      };
    } catch {
      return null;
    }
  }

  /**
   * 删除文件
   */
  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    const info = await this.getInfo(key);
    return info !== null;
  }

  /**
   * 列出文件
   */
  async list(options?: ListOptions): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options?.prefix,
      MaxKeys: options?.maxKeys || 100,
      ContinuationToken: options?.continuationToken,
    });

    const response = await this.client.send(command);

    const files: FileInfo[] = (response.Contents || []).map((item) => ({
      key: item.Key || '',
      filename: item.Key?.split('/').pop() || '',
      size: item.Size || 0,
      lastModified: item.LastModified,
      contentType: getMimeType(item.Key || ''),
    }));

    return {
      files,
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
    };
  }

  /**
   * 复制文件
   */
  async copy(sourceKey: string, targetKey: string): Promise<UploadResult> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: targetKey,
    });

    await this.client.send(command);

    const url = await this.getDownloadUrl(targetKey);

    return {
      key: targetKey,
      url: url.url,
      size: 0,
    };
  }
}

/**
 * 存储服务单例
 */
let storageInstance: S3StorageService | null = null;

export function resetStorageService(): void {
  storageInstance = null;
}

/**
 * 获取存储服务实例
 */
export function getStorageService(): S3StorageService {
  if (!storageInstance) {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const endpoint = process.env.S3_ENDPOINT;
    const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT;

    if (!bucket || !region) {
      throw new Error(
        'Missing S3 storage configuration. Please set:\n' +
        'S3_BUCKET and S3_REGION. Credentials and S3_ENDPOINT are optional when the runtime provides them.'
      );
    }

    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set together');
    }

    console.log('[存储] 使用 S3 兼容对象存储服务');
    storageInstance = new S3StorageService({
      accessKeyId,
      secretAccessKey,
      bucket,
      region,
      endpoint,
      publicEndpoint,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  return storageInstance;
}
