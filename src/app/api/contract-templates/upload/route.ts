import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * POST /api/contract-templates/upload
 * 上传合同文档和附件
 * 
 * 请求格式：multipart/form-data
 * - file: 主合同文档（Word）
 * - templateId: 现有模板ID（可选），如果传入则更新现有模板，否则创建新模板
 * - attachments[]: 附件文件数组（可选）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    
    const mainFile = formData.get('file') as File;
    const attachments = formData.getAll('attachments') as File[];
    const existingTemplateId = formData.get('templateId') as string; // 获取现有的 templateId
    
    if (!mainFile) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的合同文档' },
        { status: 400 }
      );
    }

    // 验证主文件类型 - 仅支持 Word 文档
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (!allowedTypes.includes(mainFile.type)) {
      return NextResponse.json(
        { success: false, error: '合同文档仅支持 Word 格式（.doc 或 .docx）' },
        { status: 400 }
      );
    }

    // 验证附件类型
    const allowedAttachmentTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
    ];
    
    for (const att of attachments) {
      if (att && !allowedAttachmentTypes.includes(att.type)) {
        return NextResponse.json(
          { success: false, error: `附件"${att.name}"格式不支持，支持 PDF、Word、图片格式` },
          { status: 400 }
        );
      }
    }

    // 确定主文件类型
    const fileType = mainFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      ? 'docx' 
      : 'doc';

    // 决定使用现有模板ID还是创建新的
    const templateId = existingTemplateId || randomUUID();
    const now = new Date().toISOString();
    const isUpdating = !!existingTemplateId; // 是否更新现有模板

    // 上传主文件
    const mainFileId = randomUUID();
    const mainFileExt = mainFile.name.split('.').pop() || fileType;
    const mainStoragePath = `${templateId}/main.${mainFileExt}`;
    
    const mainFileBuffer = await mainFile.arrayBuffer();
    const { error: mainUploadError } = await supabase.storage
      .from('contract-templates')
      .upload(mainStoragePath, mainFileBuffer, {
        contentType: mainFile.type,
        upsert: false,
      });

    if (mainUploadError) {
      console.error('上传主文件失败:', mainUploadError);
      return NextResponse.json(
        { success: false, error: `上传合同文档失败: ${mainUploadError.message}` },
        { status: 500 }
      );
    }

    // 获取主文件公开URL
    const { data: mainUrlData } = supabase.storage
      .from('contract-templates')
      .getPublicUrl(mainStoragePath);

    const mainFileUrl = mainUrlData.publicUrl;

    let templateData;
    let templateError;

    if (isUpdating) {
      // 更新现有模板
      const result = await supabase
        .from('contract_templates')
        .update({
          source_file_url: mainFileUrl,
          source_file_name: mainFile.name,
          source_file_type: fileType,
          updated_at: now,
        })
        .eq('id', templateId)
        .select()
        .single();
      
      templateData = result.data;
      templateError = result.error;
    } else {
      // 创建新模板
      const templateName = mainFile.name.replace(/\.[^/.]+$/, '');
      const result = await supabase
        .from('contract_templates')
        .insert({
          id: templateId,
          name: templateName,
          type: 'tenant',
          status: 'draft',
          source_file_url: mainFileUrl,
          source_file_name: mainFile.name,
          source_file_type: fileType,
          parse_status: 'pending',
          is_active: true,
          is_default: false,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      
      templateData = result.data;
      templateError = result.error;
    }

    if (templateError) {
      console.error(isUpdating ? '更新模板失败:' : '创建模板失败:', templateError);
      // 删除已上传的文件
      await supabase.storage.from('contract-templates').remove([mainStoragePath]);
      return NextResponse.json(
        { success: false, error: isUpdating ? '更新模板失败' : '创建模板失败' },
        { status: 500 }
      );
    }

    // 上传附件并创建记录
    const uploadedAttachments: Array<{
      id: string;
      name: string;
      url: string;
      fileType: string;
      size: number;
    }> = [];

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att || att.size === 0) continue;

      const attId = randomUUID();
      const attExt = att.name.split('.').pop() || 'bin';
      const attStoragePath = `${templateId}/attachments/${attId}.${attExt}`;
      
      const attBuffer = await att.arrayBuffer();
      const { error: attUploadError } = await supabase.storage
        .from('contract-templates')
        .upload(attStoragePath, attBuffer, {
          contentType: att.type,
          upsert: false,
        });

      if (attUploadError) {
        console.error(`上传附件 ${att.name} 失败:`, attUploadError);
        continue;
      }

      // 获取附件公开URL
      const { data: attUrlData } = supabase.storage
        .from('contract-templates')
        .getPublicUrl(attStoragePath);

      // 确定附件文件类型
      let attFileType = 'other';
      if (att.type === 'application/pdf') attFileType = 'pdf';
      else if (att.type.includes('word')) attFileType = 'word';
      else if (att.type.includes('image')) attFileType = 'image';

      // 创建附件记录
      const { data: attRecord, error: attDbError } = await supabase
        .from('contract_attachments')
        .insert({
          id: attId,
          template_id: templateId,
          name: att.name.replace(/\.[^/.]+$/, ''), // 去除扩展名
          source_file_url: attUrlData.publicUrl,
          source_file_name: att.name,
          required: false,
          order: i + 1,
        })
        .select()
        .single();

      if (attDbError) {
        console.error('创建附件记录失败:', attDbError);
      } else {
        uploadedAttachments.push({
          id: attId,
          name: att.name,
          url: attUrlData.publicUrl,
          fileType: attFileType,
          size: att.size,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        fileUrl: mainFileUrl,
        fileName: mainFile.name,
        fileType,
        template: templateData,
        attachments: uploadedAttachments,
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
