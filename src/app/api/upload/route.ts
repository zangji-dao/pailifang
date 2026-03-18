/**
 * 文件上传 API
 * POST /api/upload - 上传文件到对象存储
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageService, FileType, getStoragePrefix, validateFileSize } from '@/storage/object';

// 文件类型映射
const FILE_TYPE_MAP: Record<string, FileType> = {
  'image': FileType.IMAGE,
  'voucher': FileType.VOUCHER,
  'contract': FileType.CONTRACT,
  'export': FileType.EXPORT,
  'document': FileType.DOCUMENT,
  'temp': FileType.TEMP,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'document';
    const customKey = formData.get('key') as string | undefined;
    
    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 获取文件类型
    const fileType = FILE_TYPE_MAP[type] || FileType.DOCUMENT;

    // 验证文件大小
    if (!validateFileSize(file.size, fileType)) {
      return NextResponse.json(
        { error: `文件大小超过限制（${Math.round(file.size / 1024 / 1024)}MB）` },
        { status: 400 }
      );
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());

    // 构建存储路径
    let key = customKey;
    if (!key) {
      // 根据类型生成路径
      const prefix = getStoragePrefix(fileType);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'bin';
      key = `${prefix}/${timestamp}-${random}.${ext}`;
    }

    // 上传文件
    const storage = getStorageService();
    const result = await storage.upload(buffer, file.name, {
      key,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        filename: file.name,
        type: fileType,
      },
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}
