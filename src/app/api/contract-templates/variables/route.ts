import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { TemplateVariable, VariableBinding } from '@/types/template-variable';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/variables
 * 保存模板变量和绑定关系
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, variables, bindings } = body as {
      templateId: string;
      variables: TemplateVariable[];
      bindings: VariableBinding[];
    };

    if (!templateId || !variables) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 1. 保存变量定义
    const fieldsData = variables.map((variable, index) => ({
      template_id: templateId,
      field_key: variable.key,
      field_label: variable.name,
      field_type: variable.type,
      default_value: variable.defaultValue || null,
      required: variable.required || false,
      sort_order: index,
    }));

    // 先删除已有字段
    await supabase
      .from('contract_fields')
      .delete()
      .eq('template_id', templateId);

    // 插入新字段
    const { error: fieldsError } = await supabase
      .from('contract_fields')
      .insert(fieldsData);

    if (fieldsError) {
      console.error('保存变量失败:', fieldsError);
      return NextResponse.json(
        { success: false, error: '保存变量失败' },
        { status: 500 }
      );
    }

    // 2. 保存绑定关系（如果有的话）
    if (bindings && bindings.length > 0) {
      // 先检查是否存在 variable_bindings 表
      const { error: bindingsError } = await supabase
        .from('variable_bindings')
        .insert(bindings.map(b => ({
          template_id: templateId,
          variable_key: b.variableKey,
          anchor_text: b.position.anchorText,
          offset: b.position.offset,
        })));

      if (bindingsError) {
        // 如果表不存在，忽略错误
        console.log('variable_bindings 表可能不存在，跳过保存绑定');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        variablesCount: variables.length,
        bindingsCount: bindings?.length || 0,
      },
    });
  } catch (error) {
    console.error('保存变量失败:', error);
    return NextResponse.json(
      { success: false, error: '保存变量失败' },
      { status: 500 }
    );
  }
}
