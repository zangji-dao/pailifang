import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * POST /api/contract-templates/upload-attachment
 * 单独上传附件（不需要主文档）
 * 
 * 请求格式：multipart/form-data
 * - file: 附件文件
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
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
    const attStoragePath = `temp-attachments/${attId}.${attExt}`;
    
    // 上传文件
    const attBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('contract-templates')
      .upload(attStoragePath, attBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('上传附件失败:', uploadError);
      return NextResponse.json(
        { success: false, error: `上传附件失败: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('contract-templates')
      .getPublicUrl(attStoragePath);

    // 确定文件类型
    const fileType = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      ? 'docx' 
      : 'doc';

    return NextResponse.json({
      success: true,
      data: {
        id: attId,
        name: file.name,
        url: urlData.publicUrl,
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
