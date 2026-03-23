import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

/**
 * POST /api/storage/upload
 * 上传文件到对象存储
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'document';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 转发到后端服务
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('type', type);

    const backendUrl = config.backend.baseUrl;
    const response = await fetch(`${backendUrl}/api/storage/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || '上传失败' },
        { status: response.status }
      );
    }

    // 返回上传结果
    return NextResponse.json({
      success: true,
      url: result.data?.url,
      key: result.data?.key,
      filename: result.data?.filename,
      size: result.data?.size,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { success: false, error: '上传失败' },
      { status: 500 }
    );
  }
}
