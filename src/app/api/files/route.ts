/**
 * 文件列表 API
 * GET /api/files - 列出存储桶中的文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/storage/object';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const prefix = searchParams.get('prefix') || undefined;
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100');
    const continuationToken = searchParams.get('continuationToken') || undefined;

    // 列出文件
    const storage = getStorageService();
    const result = await storage.list({
      prefix,
      maxKeys,
      continuationToken,
    });

    return NextResponse.json({
      success: true,
      data: {
        files: result.files,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      },
    });
  } catch (error: any) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取失败' },
      { status: 500 }
    );
  }
}
