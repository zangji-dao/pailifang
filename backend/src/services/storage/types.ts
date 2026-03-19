/**
 * 对象存储服务类型定义
 * 支持 S3 兼容存储（Lighthouse 轻量对象存储）
 */

/**
 * 存储配置
 */
export interface StorageConfig {
  /** 存储类型: s3 */
  type: 's3';
  
  /** S3 配置 */
  s3: {
    /** 访问密钥 ID */
    accessKeyId: string;
    /** 访问密钥 */
    secretAccessKey: string;
    /** 存储桶名称 */
    bucket: string;
    /** 区域 */
    region: string;
    /** 端点 URL */
    endpoint: string;
  };
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件键（路径） */
  key: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  contentType: string;
  /** 最后修改时间 */
  lastModified?: Date;
  /** 访问 URL（临时或永久） */
  url?: string;
}

/**
 * 上传选项
 */
export interface UploadOptions {
  /** 文件键（路径），不指定则自动生成 */
  key?: string;
  /** MIME 类型 */
  contentType?: string;
  /** 文件元数据 */
  metadata?: Record<string, string>;
  /** 是否公开可访问 */
  public?: boolean;
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 文件键（路径） */
  key: string;
  /** 访问 URL */
  url: string;
  /** 文件大小 */
  size: number;
}

/**
 * 下载选项
 */
export interface DownloadOptions {
  /** 下载链接有效期（秒），默认 3600 */
  expiresIn?: number;
}

/**
 * 下载结果
 */
export interface DownloadResult {
  /** 文件键（路径） */
  key: string;
  /** 下载 URL（临时签名 URL） */
  url: string;
  /** 过期时间 */
  expiresAt: Date;
}

/**
 * 列表选项
 */
export interface ListOptions {
  /** 前缀过滤 */
  prefix?: string;
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  continuationToken?: string;
}

/**
 * 列表结果
 */
export interface ListResult {
  /** 文件列表 */
  files: FileInfo[];
  /** 是否还有更多 */
  isTruncated: boolean;
  /** 下一页标记 */
  nextContinuationToken?: string;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 上传文件
   * @param buffer 文件内容
   * @param filename 原始文件名
   * @param options 上传选项
   */
  upload(
    buffer: Buffer,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * 下载文件（获取下载链接）
   * @param key 文件键
   * @param options 下载选项
   */
  getDownloadUrl(key: string, options?: DownloadOptions): Promise<DownloadResult>;

  /**
   * 获取文件内容
   * @param key 文件键
   */
  getBuffer(key: string): Promise<Buffer>;

  /**
   * 获取文件信息
   * @param key 文件键
   */
  getInfo(key: string): Promise<FileInfo | null>;

  /**
   * 删除文件
   * @param key 文件键
   */
  delete(key: string): Promise<boolean>;

  /**
   * 检查文件是否存在
   * @param key 文件键
   */
  exists(key: string): Promise<boolean>;

  /**
   * 列出文件
   * @param options 列表选项
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * 复制文件
   * @param sourceKey 源文件键
   * @param targetKey 目标文件键
   */
  copy(sourceKey: string, targetKey: string): Promise<UploadResult>;
}

/**
 * 文件类型枚举
 */
export enum FileType {
  /** 图片 */
  IMAGE = 'image',
  /** 文档 */
  DOCUMENT = 'document',
  /** 凭证附件 */
  VOUCHER = 'voucher',
  /** 合同 */
  CONTRACT = 'contract',
  /** 导出文件 */
  EXPORT = 'export',
  /** 临时文件 */
  TEMP = 'temp',
  /** 身份证 */
  ID_CARD = 'id_card',
  /** 营业执照 */
  LICENSE = 'license',
}

/**
 * 项目存储前缀（用于多项目隔离）
 */
export const PROJECT_PREFIX = 'pi-cube';

/**
 * 根据文件类型获取存储路径前缀
 */
export function getStoragePrefix(type: FileType, ...parts: string[]): string {
  const typePrefixes: Record<FileType, string> = {
    [FileType.IMAGE]: 'avatars',
    [FileType.DOCUMENT]: 'documents',
    [FileType.VOUCHER]: 'vouchers',
    [FileType.CONTRACT]: 'contracts',
    [FileType.EXPORT]: 'exports',
    [FileType.TEMP]: 'temp',
    [FileType.ID_CARD]: 'id-cards',
    [FileType.LICENSE]: 'licenses',
  };

  const parts_ = parts.filter(Boolean);
  return [PROJECT_PREFIX, typePrefixes[type], ...parts_].join('/');
}

/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @param prefix 路径前缀
 */
export function generateUniqueKey(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || '';
  const filename = `${timestamp}-${random}.${ext}`;
  
  return prefix ? `${prefix}/${filename}` : filename;
}

/**
 * 获取文件扩展名对应的 MIME 类型
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // 图片
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // 文档
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 文本
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    // 压缩
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 文件大小限制（字节）
 */
export const FILE_SIZE_LIMITS: Record<FileType, number> = {
  [FileType.IMAGE]: 5 * 1024 * 1024,        // 5 MB
  [FileType.DOCUMENT]: 20 * 1024 * 1024,    // 20 MB
  [FileType.VOUCHER]: 20 * 1024 * 1024,     // 20 MB
  [FileType.CONTRACT]: 20 * 1024 * 1024,    // 20 MB
  [FileType.EXPORT]: 50 * 1024 * 1024,      // 50 MB
  [FileType.TEMP]: 50 * 1024 * 1024,        // 50 MB
  [FileType.ID_CARD]: 5 * 1024 * 1024,      // 5 MB
  [FileType.LICENSE]: 5 * 1024 * 1024,      // 5 MB
};

/**
 * 检查文件大小是否超限
 */
export function validateFileSize(size: number, type: FileType): boolean {
  return size <= FILE_SIZE_LIMITS[type];
}
