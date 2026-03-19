/**
 * 文件存储路由
 */

import { Router, Request, Response } from 'express';
import { getStorageService, FileType, getStoragePrefix, validateFileSize } from '../services/storage';

const router = Router();

// 文件类型映射
const FILE_TYPE_MAP: Record<string, FileType> = {
  image: FileType.IMAGE,
  voucher: FileType.VOUCHER,
  contract: FileType.CONTRACT,
  export: FileType.EXPORT,
  document: FileType.DOCUMENT,
  temp: FileType.TEMP,
  id_card: FileType.ID_CARD,
};

/**
 * @route POST /api/storage/upload
 * @desc 上传文件
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件',
      });
    }

    const { type = 'document', key: customKey } = req.body;
    
    // 获取文件类型
    const fileType = FILE_TYPE_MAP[type] || FileType.DOCUMENT;

    // 验证文件大小
    if (!validateFileSize(req.file.size, fileType)) {
      return res.status(400).json({
        success: false,
        error: `文件大小超过限制（${Math.round(req.file.size / 1024 / 1024)}MB）`,
      });
    }

    // 构建存储路径
    let key = customKey;
    if (!key) {
      const prefix = getStoragePrefix(fileType);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = req.file.originalname.split('.').pop() || 'bin';
      key = `${prefix}/${timestamp}-${random}.${ext}`;
    }

    // 上传文件
    const storage = getStorageService();
    const result = await storage.upload(req.file.buffer, req.file.originalname, {
      key,
      contentType: req.file.mimetype,
    });

    res.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        filename: req.file.originalname,
        type: fileType,
      },
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '上传失败',
    });
  }
});

/**
 * @route GET /api/storage/files
 * @desc 列出文件
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    const { prefix, maxKeys = '100', continuationToken } = req.query;

    const storage = getStorageService();
    const result = await storage.list({
      prefix: prefix as string,
      maxKeys: parseInt(maxKeys as string, 10),
      continuationToken: continuationToken as string,
    });

    res.json({
      success: true,
      data: {
        files: result.files,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      },
    });
  } catch (error: any) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取失败',
    });
  }
});

/**
 * @route GET /api/storage/files/:key
 * @desc 获取文件下载链接
 */
router.get('/files/:key(*)', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { expiresIn } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: '请提供文件路径',
      });
    }

    const storage = getStorageService();
    
    // 检查文件是否存在
    const exists = await storage.exists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: '文件不存在',
      });
    }

    // 获取下载链接
    const result = await storage.getDownloadUrl(key, {
      expiresIn: expiresIn ? parseInt(expiresIn as string, 10) : 3600,
    });

    res.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('获取文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取失败',
    });
  }
});

/**
 * @route DELETE /api/storage/files/:key
 * @desc 删除文件
 */
router.delete('/files/:key(*)', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: '请提供文件路径',
      });
    }

    const storage = getStorageService();
    const success = await storage.delete(key);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: '删除失败，文件可能不存在',
      });
    }

    res.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error: any) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除失败',
    });
  }
});

export default router;
