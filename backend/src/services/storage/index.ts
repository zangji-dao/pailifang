/**
 * 对象存储服务
 * 使用 Coze 平台提供的 S3Storage (coze-coding-dev-sdk)
 */

// 首先重导出 types 中的所有内容
export * from './types';

import { S3Storage } from 'coze-coding-dev-sdk';
import type {
  IStorageService,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  DownloadResult,
  ListOptions,
  ListResult,
  FileInfo,
} from './types';
import { generateUniqueKey, getMimeType } from './types';

/**
 * Coze S3 存储服务实现
 * 使用 coze-coding-dev-sdk 提供的 S3Storage
 */
export class CozeS3StorageService implements IStorageService {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
    console.log('[存储] 使用 Coze 平台对象存储服务');
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

    const actualKey = await this.storage.uploadFile({
      fileContent: buffer,
      fileName: key,
      contentType,
    });

    // 生成访问 URL
    const url = await this.storage.generatePresignedUrl({
      key: actualKey,
      expireTime: 86400 * 30, // 30 天有效期
    });

    return {
      key: actualKey,
      url,
      size: buffer.length,
    };
  }

  /**
   * 获取下载链接（临时签名 URL）
   */
  async getDownloadUrl(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    const expiresIn = options?.expiresIn || 86400; // 默认 1 天

    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: expiresIn,
    });

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
    const data = await this.storage.readFile({ fileKey: key });
    return Buffer.from(data);
  }

  /**
   * 获取文件信息
   */
  async getInfo(key: string): Promise<FileInfo | null> {
    try {
      const exists = await this.storage.fileExists({ fileKey: key });
      if (!exists) return null;

      // 生成临时访问 URL
      const url = await this.storage.generatePresignedUrl({
        key,
        expireTime: 3600,
      });

      return {
        key,
        filename: key.split('/').pop() || key,
        size: 0, // SDK 不提供获取文件大小的方法
        contentType: getMimeType(key),
        url,
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
      return await this.storage.deleteFile({ fileKey: key });
    } catch {
      return false;
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    return this.storage.fileExists({ fileKey: key });
  }

  /**
   * 列出文件
   */
  async list(options?: ListOptions): Promise<ListResult> {
    const result = await this.storage.listFiles({
      prefix: options?.prefix,
      maxKeys: options?.maxKeys || 100,
      continuationToken: options?.continuationToken,
    });

    const files: FileInfo[] = result.keys.map((key) => ({
      key,
      filename: key.split('/').pop() || key,
      size: 0,
      contentType: getMimeType(key),
    }));

    return {
      files,
      isTruncated: result.isTruncated,
      nextContinuationToken: result.nextContinuationToken,
    };
  }

  /**
   * 复制文件
   */
  async copy(sourceKey: string, targetKey: string): Promise<UploadResult> {
    // 读取源文件
    const buffer = await this.getBuffer(sourceKey);
    
    // 上传到新位置
    return this.upload(buffer, targetKey, { key: targetKey });
  }
}

// 存储服务单例
let storageInstance: CozeS3StorageService | null = null;

/**
 * 获取存储服务实例
 */
export function getStorageService(): CozeS3StorageService {
  if (!storageInstance) {
    storageInstance = new CozeS3StorageService();
  }
  return storageInstance;
}
