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
      enterpriseCode: data.enterprise_code,
      creditCode: data.credit_code,
      legalPerson: data.legal_person,
      phone: data.phone,
      industry: data.industry,
      type: data.type,
      status: data.status,
      processStatus: data.process_status,
      registeredAddress: data.registered_address,
      businessAddress: data.business_address,
      businessScope: data.business_scope,
      settledDate: data.settled_date,
      remarks: data.remarks,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
