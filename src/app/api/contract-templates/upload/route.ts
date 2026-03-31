import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * POST /api/contract-templates/upload
 * 上传合同文档（仅支持 Word 文档）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型 - 仅支持 Word 文档
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '仅支持 Word 文档（.doc 或 .docx 格式）' },
        { status: 400 }
      );
    }

    // 确定文件类型
    const fileType = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      ? 'docx' 
      : 'doc';

    // 生成文件存储路径 - 使用安全的文件名
    const fileId = randomUUID();
    const ext = file.name.split('.').pop() || fileType;
    const storagePath = `${fileId}.${ext}`;
    
    // 读取文件内容
    const fileBuffer = await file.arrayBuffer();
    
    // 上传文件到Supabase存储
    const { error: uploadError } = await supabase.storage
      .from('contract-templates')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('上传文件失败:', uploadError);
      return NextResponse.json(
        { success: false, error: `上传文件失败: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 获取文件公开URL
    const { data: urlData } = supabase.storage
      .from('contract-templates')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // 如果提供了模板ID，更新现有模板
    if (templateId) {
      const { error: updateError } = await supabase
        .from('contract_templates')
        .update({
          source_file_url: fileUrl,
          source_file_name: file.name,
          source_file_type: fileType,
          parse_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (updateError) {
        console.error('更新模板失败:', updateError);
      }

      return NextResponse.json({
        success: true,
        data: {
          templateId,
          fileUrl,
          fileName: file.name,
          fileType,
        },
      });
    }

    // 创建新的模板记录
    const newTemplateId = randomUUID();
    const now = new Date().toISOString();
    const templateName = file.name.replace(/\.[^/.]+$/, '');

    const { data: templateData, error: templateError } = await supabase
      .from('contract_templates')
      .insert({
        id: newTemplateId,
        name: templateName,
        type: 'tenant',
        source_file_url: fileUrl,
        source_file_name: file.name,
        source_file_type: fileType,
        parse_status: 'pending',
        is_active: true,
        is_default: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (templateError) {
      console.error('创建模板失败:', templateError);
      // 删除已上传的文件
      await supabase.storage.from('contract-templates').remove([storagePath]);
      return NextResponse.json(
        { success: false, error: '创建模板失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId: newTemplateId,
        fileUrl,
        fileName: file.name,
        fileType,
        template: templateData,
      },
    });
  } catch (error) {
    console.error('上传文档失败:', error);
    return NextResponse.json(
      { success: false, error: '上传文档失败' },
      { status: 500 }
    );
  }
}
