import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    } = body;

    const now = new Date().toISOString();

    // 如果有id，直接更新该模板的草稿数据
    if (id) {
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('contract_templates')
        .select('id, status, name')
        .eq('id', id)
        .single();

      if (existingTemplate) {
        // 无论是草稿还是已发布，都直接更新该模板的草稿数据
        const { data, error } = await supabase
          .from('contract_templates')
          .update({
            name: name || (existingTemplate as any).name || '未命名模板',
            description,
            type: type || 'tenant',
            base_id,
            // 保持原有状态，已发布的模板保存草稿时不改变状态
            // status: existingTemplate.status, // 保持原状态
            source_file_url: source_file_url || undefined,
            source_file_name: source_file_name || undefined,
            source_file_type: source_file_type || undefined,
            draft_data: {
              currentStep,
              editedHtml,
              markers,
              selectedVariables,
              bindings,
              attachments,
              styles,
              uploadedAttachments,
            },
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('保存草稿失败:', error);
          return NextResponse.json(
            { success: false, error: `保存草稿失败: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { id, ...data },
          message: '草稿已保存',
        });
      }
    }

    // 创建新草稿（新建模板的情况）
    const templateId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        id: templateId,
        name: name || '未命名草稿',
        description,
        type: type || 'tenant',
        base_id,
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
        },
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

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    return NextResponse.json(
      { success: false, error: '获取草稿失败' },
      { status: 500 }
    );
  }
}
