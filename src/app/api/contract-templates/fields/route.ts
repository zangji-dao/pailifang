import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ContractFieldDefinition } from '@/types/contract-template';
import { randomUUID } from 'crypto';

/**
 * GET /api/contract-templates/fields
 * 获取模板的可填充字段
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: '缺少模板ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_fields')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取字段失败:', error);
      return NextResponse.json(
        { success: false, error: '获取字段失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('获取字段失败:', error);
    return NextResponse.json(
      { success: false, error: '获取字段失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contract-templates/fields
 * 保存字段定义
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, fields } = body as { 
      templateId: string; 
      fields: ContractFieldDefinition[] 
    };

    if (!templateId || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 先删除该模板的旧字段
    await supabase
      .from('contract_fields')
      .delete()
      .eq('template_id', templateId);

    // 插入新字段
    const fieldsData = fields.map((field, index) => ({
      id: randomUUID(),
      template_id: templateId,
      field_key: field.key,
      field_label: field.label,
      field_type: field.type || 'text',
      default_value: field.defaultValue || null,
      options: field.options || null,
      required: field.required || false,
      placeholder: field.placeholder || null,
      sort_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('contract_fields')
      .insert(fieldsData)
      .select();

    if (error) {
      console.error('保存字段失败:', error);
      return NextResponse.json(
        { success: false, error: '保存字段失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('保存字段失败:', error);
    return NextResponse.json(
      { success: false, error: '保存字段失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contract-templates/fields
 * 更新单个字段
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { fieldId, ...updateData } = body;

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: '缺少字段ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_fields')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('更新字段失败:', error);
      return NextResponse.json(
        { success: false, error: '更新字段失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('更新字段失败:', error);
    return NextResponse.json(
      { success: false, error: '更新字段失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contract-templates/fields
 * 删除字段
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: '缺少字段ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contract_fields')
      .delete()
      .eq('id', fieldId);

    if (error) {
      console.error('删除字段失败:', error);
      return NextResponse.json(
        { success: false, error: '删除字段失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除字段失败:', error);
    return NextResponse.json(
      { success: false, error: '删除字段失败' },
      { status: 500 }
    );
  }
}
