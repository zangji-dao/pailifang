/**
 * 文件管理 API
 * GET /api/files/[...key] - 获取文件下载链接
 * DELETE /api/files/[...key] - 删除文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/storage/object';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = keyParts.join('/');

    if (!key) {
      return NextResponse.json(
        { error: '请提供文件路径' },
        { status: 400 }
      );
    }

    // 获取下载链接
    const storage = getStorageService();
    
    // 先检查文件是否存在
    const exists = await storage.exists(key);
    if (!exists) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 获取下载链接（有效期 1 小时）
    const result = await storage.getDownloadUrl(key, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('获取文件失败:', error);
    return NextResponse.json(
      { error: error.message || '获取失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = keyParts.join('/');

    if (!key) {
      return NextResponse.json(
        { error: '请提供文件路径' },
        { status: 400 }
      );
    }

    // 删除文件
    const storage = getStorageService();
    const success = await storage.delete(key);

    if (!success) {
      return NextResponse.json(
        { error: '删除失败，文件可能不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error: any) {
    console.error('删除文件失败:', error);
    return NextResponse.json(
      { error: error.message || '删除失败' },
      { status: 500 }
    );
  }
}
