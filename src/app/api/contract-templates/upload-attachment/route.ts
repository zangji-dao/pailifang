import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';

/**
 * POST /api/contract-templates/upload-attachment
 * 单独上传附件（不需要主文档）
 * 
 * 请求格式：multipart/form-data
 * - file: 附件文件
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的附件' },
        { status: 400 }
      );
    }

    // 验证附件类型 - 仅支持 Word 文档
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '附件仅支持 Word 格式（.doc 或 .docx）' },
        { status: 400 }
      );
    }

    // 生成唯一ID和存储路径
    const attId = randomUUID();
    const attExt = file.name.split('.').pop() || 'docx';
    const attStorageKey = `contract-templates/temp-attachments/${attId}.${attExt}`;
    
    // 上传文件到后端 COS
    const attBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToBackend(attStorageKey, Buffer.from(attBuffer), file.name, file.type, 'contract');

    if (!uploadResult.success) {
      console.error('上传附件失败:', uploadResult.error);
      return NextResponse.json(
        { success: false, error: `上传附件失败: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    // 确定文件类型
    const fileType = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ? 'docx'
      : 'doc';

    console.log('上传附件成功:', {
      id: attId,
      name: file.name,
      url: uploadResult.url,
      fileType,
      size: file.size,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: attId,
        name: file.name,
        url: uploadResult.url,
        storageKey: attStorageKey,
        fileType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('上传附件失败:', error);
    return NextResponse.json(
      { success: false, error: '上传附件失败' },
      { status: 500 }
    );
  }
}

/**
 * 上传文件到后端 COS 存储
 */
async function uploadToBackend(
  key: string,
  buffer: Buffer,
  filename: string,
  contentType: string,
  type: string = 'document'
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
    formData.append('file', blob, filename);
    formData.append('type', type);
    formData.append('key', key);

    const response = await fetch(`${BACKEND_URL}/api/storage/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        url: result.data.url,
        key: result.data.key,
      };
    } else {
      return {
        success: false,
        error: result.error || '上传失败',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '上传请求失败',
    };
  }
}
