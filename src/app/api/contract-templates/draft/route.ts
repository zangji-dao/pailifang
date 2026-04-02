import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 验证是否为有效的 UUID 格式
function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * POST /api/contract-templates/draft
 * 保存草稿（支持中间状态保存）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      id,
      name,
      description,
      type,
      base_id,
      currentStep,
      editedHtml,
      markers,
      selectedVariables,
      bindings,
      source_file_url,
      source_file_name,
      source_file_type,
      styles,
      attachments,
      uploadedAttachments,
      originalHtml,
    } = body;

    const now = new Date().toISOString();

    // 验证 id 格式（如果提供了 id）
    if (id && !isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: '无效的模板ID格式' },
        { status: 400 }
      );
    }

    // 验证 base_id 格式（如果提供了 base_id）
    // 将空字符串转换为 null
    const validBaseId = base_id && isValidUUID(base_id) ? base_id : null;

    // 如果有id，直接更新该模板的草稿数据
    if (id) {
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('contract_templates')
        .select('id, status, name, draft_data')
        .eq('id', id)
        .single();

      if (existingTemplate) {
        // 兼容性处理：如果新的 selectedVariables 为空，但旧的 draft_data 中有，则保留旧的
        let finalSelectedVariables = selectedVariables;
        const existingDraftData = (existingTemplate as any).draft_data;
        if (existingDraftData && 
            (!selectedVariables || selectedVariables.length === 0) && 
            existingDraftData.selectedVariables && 
            existingDraftData.selectedVariables.length > 0) {
          finalSelectedVariables = existingDraftData.selectedVariables;
          console.log('兼容性处理：保留旧的 selectedVariables');
        }

        // 兼容性处理：保留旧 draft_data 中的其他字段，只更新传入的字段
        let finalDraftData: any = {
          currentStep,
          editedHtml,
          markers,
          selectedVariables: finalSelectedVariables,
          bindings,
          attachments,
          styles,
          uploadedAttachments,
          // 保存原始 HTML，用于恢复显示
          originalHtml,
        };

        // 如果旧的 draft_data 中有 original_template_id，保留它（历史兼容性）
        if (existingDraftData && existingDraftData.original_template_id) {
          finalDraftData.original_template_id = existingDraftData.original_template_id;
        }

        // 构建要保存的附件列表（同时保存到 template.attachments 字段）
        // 优先使用 uploadedAttachments（上传步骤），其次使用 attachments（解析后的附件）
        let attachmentsToSave: any[] | undefined;
        const attachmentsSource = (uploadedAttachments && uploadedAttachments.length > 0) 
          ? uploadedAttachments 
          : attachments;
        
        if (attachmentsSource && attachmentsSource.length > 0) {
          attachmentsToSave = attachmentsSource.map((a: any) => ({
            id: a.id,
            name: a.name || a.displayName || '未命名附件',
            url: a.url || '',
            description: '',
            required: false,
            order: a.order || 0,
          }));
        }

        // 无论是草稿还是已发布，都直接更新该模板的草稿数据
        const { data, error } = await supabase
          .from('contract_templates')
          .update({
            name: name || (existingTemplate as any).name || '未命名模板',
            description,
            type: type || 'tenant',
            base_id: validBaseId,
            // 保持原有状态，已发布的模板保存草稿时不改变状态
            // status: existingTemplate.status, // 保持原状态
            source_file_url: source_file_url || undefined,
            source_file_name: source_file_name || undefined,
            source_file_type: source_file_type || undefined,
            draft_data: finalDraftData,
            // 同时更新 attachments 字段，这样列表页也能看到附件信息
            ...(attachmentsToSave ? { attachments: attachmentsToSave } : {}),
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('保存失败:', error);
          return NextResponse.json(
            { success: false, error: `保存失败: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { id, ...data },
          message: '已保存',
        });
      }
    }

    // 创建新草稿（新建模板的情况）
    const templateId = crypto.randomUUID();
    
    // 构建要保存的附件列表
    let attachmentsToSave: any[] | undefined;
    if (attachments && attachments.length > 0) {
      attachmentsToSave = attachments.map((a: any) => ({
        id: a.id,
        name: a.name || a.displayName || '未命名附件',
        url: a.url || '',
        description: '',
        required: false,
        order: a.order || 0,
      }));
    }
    
    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        id: templateId,
        name: name || '未命名草稿',
        description,
        type: type || 'tenant',
        base_id: validBaseId,
        status: 'draft',
        source_file_url,
        source_file_name,
        source_file_type,
        draft_data: {
          currentStep,
          editedHtml,
          markers,
          selectedVariables,
          bindings,
          attachments,
          styles,
          uploadedAttachments,
          // 保存原始 HTML，用于恢复显示
          originalHtml,
        },
        // 同时保存 attachments 字段
        ...(attachmentsToSave ? { attachments: attachmentsToSave } : {}),
        is_default: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('创建草稿失败:', error);
      return NextResponse.json(
        { success: false, error: `创建草稿失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: templateId, ...data },
      message: '草稿已保存',
    });
  } catch (error) {
    console.error('保存草稿失败:', error);
    return NextResponse.json(
      { success: false, error: '保存草稿失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contract-templates/draft
 * 获取草稿详情
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少草稿ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取草稿失败:', error);
      return NextResponse.json(
        { success: false, error: '获取草稿失败' },
        { status: 500 }
      );
    }

    // 兼容性处理：如果草稿有 original_template_id，尝试从原模板补充数据
    let enhancedData = { ...data };
    if (data.draft_data?.original_template_id) {
      const originalId = data.draft_data.original_template_id;
      console.log('检测到历史遗留草稿，尝试从原模板补充数据:', originalId);
      
      try {
        const { data: originalTemplate, error: originalError } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('id', originalId)
          .single();
          
        if (!originalError && originalTemplate) {
          // 如果草稿的 draft_data 不完整，从原模板补充
          if (!data.draft_data.selectedVariables || data.draft_data.selectedVariables.length === 0) {
            // 从 contract_fields 表获取原模板的字段
            const { data: fields } = await supabase
              .from('contract_fields')
              .select('*')
              .eq('template_id', originalId)
              .order('sort_order', { ascending: true });
              
            if (fields && fields.length > 0) {
              enhancedData.draft_data = {
                ...enhancedData.draft_data,
                selectedVariables: fields.map((f: any) => ({
                  id: f.id,
                  key: f.field_key,
                  name: f.field_label,
                  type: f.field_type || 'text',
                  category: 'custom',
                  placeholder: f.placeholder,
                }))
              };
              console.log('已从原模板补充 selectedVariables');
            }
          }
        }
      } catch (originalErr) {
        console.error('从原模板补充数据失败:', originalErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: enhancedData,
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    return NextResponse.json(
      { success: false, error: '获取草稿失败' },
      { status: 500 }
    );
  }
}
