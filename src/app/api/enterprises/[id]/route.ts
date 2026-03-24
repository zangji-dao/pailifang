import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/enterprises/[id]
 * 获取单个企业详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取企业详情失败:', error);
      return NextResponse.json(
        { success: false, error: '获取企业详情失败' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '企业不存在' },
        { status: 404 }
      );
    }

    // 格式化返回数据
    const formattedData = {
      id: data.id,
      name: data.name,
      enterprise_code: data.enterprise_code,
      credit_code: data.credit_code,
      legal_person: data.legal_person,
      phone: data.phone,
      industry: data.industry,
      type: data.type,
      status: data.status,
      process_status: data.process_status,
      registered_address: data.registered_address,
      business_address: data.business_address,
      business_scope: data.business_scope,
      settled_date: data.settled_date,
      remarks: data.remarks,
      space_id: data.space_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('获取企业详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取企业详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/enterprises/[id]
 * 更新企业信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    // 如果要更新名称，检查是否与其他企业重复
    if (body.name) {
      const { data: existingName } = await supabase
        .from('enterprises')
        .select('id, name')
        .eq('name', body.name)
        .neq('id', id) // 排除自身
        .neq('process_status', 'terminated') // 排除已终止的企业
        .single();

      if (existingName) {
        return NextResponse.json(
          { success: false, error: `企业名称「${body.name}」已存在，请使用其他名称` },
          { status: 400 }
        );
      }
    }

    // 构建更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.enterprise_code !== undefined) updateData.enterprise_code = body.enterprise_code;
    if (body.credit_code !== undefined) updateData.credit_code = body.credit_code;
    if (body.legal_person !== undefined) updateData.legal_person = body.legal_person;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.process_status !== undefined) updateData.process_status = body.process_status;
    if (body.registered_address !== undefined) updateData.registered_address = body.registered_address;
    if (body.business_address !== undefined) updateData.business_address = body.business_address;
    if (body.business_scope !== undefined) updateData.business_scope = body.business_scope;
    if (body.settled_date !== undefined) updateData.settled_date = body.settled_date;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;

    const { data, error } = await supabase
      .from('enterprises')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新企业失败:', error);
      return NextResponse.json(
        { success: false, error: '更新企业失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('更新企业失败:', error);
    return NextResponse.json(
      { success: false, error: '更新企业失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/enterprises/[id]
 * 删除企业
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('enterprises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除企业失败:', error);
      return NextResponse.json(
        { success: false, error: '删除企业失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '企业已删除',
    });
  } catch (error) {
    console.error('删除企业失败:', error);
    return NextResponse.json(
      { success: false, error: '删除企业失败' },
      { status: 500 }
    );
  }
}
