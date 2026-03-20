import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/applications/[id]
 * 获取入驻申请详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('pi_settlement_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取申请详情失败:', error);
      return NextResponse.json(
        { success: false, error: error.message || '获取申请详情失败' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '申请不存在' },
        { status: 404 }
      );
    }

    // 转换为前端格式
    const result = {
      id: data.id,
      applicationNo: data.application_no,
      applicationDate: data.application_date,
      approvalStatus: data.approval_status,
      enterpriseName: data.enterprise_name,
      enterpriseNameBackups: data.enterprise_name_backups || [],
      registeredCapital: data.registered_capital?.toString() || '',
      currencyType: data.currency_type || 'CNY',
      taxType: data.tax_type || '',
      expectedAnnualRevenue: data.expected_annual_revenue?.toString() || '',
      expectedAnnualTax: data.expected_annual_tax?.toString() || '',
      originalRegisteredAddress: data.original_registered_address || '',
      mailingAddress: data.mailing_address || '',
      businessAddress: data.business_address || '',
      assignedAddressId: data.assigned_address_id || '',
      assignedAddress: data.assigned_address || '',
      personnel: data.personnel || [],
      shareholders: data.shareholders || [],
      ewtContactName: data.ewt_contact_name || '',
      ewtContactPhone: data.ewt_contact_phone || '',
      intermediaryDepartment: data.intermediary_department || '',
      intermediaryName: data.intermediary_name || '',
      intermediaryPhone: data.intermediary_phone || '',
      businessScope: data.business_scope || '',
      applicationType: data.application_type || '',
      remarks: data.remarks || '',
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取申请详情异常:', error);
    return NextResponse.json(
      { success: false, error: '获取申请详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/applications/[id]
 * 更新入驻申请
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (body.enterpriseName !== undefined) updateData.enterprise_name = body.enterpriseName;
    if (body.enterpriseNameBackups !== undefined) updateData.enterprise_name_backups = body.enterpriseNameBackups;
    if (body.registeredCapital !== undefined) updateData.registered_capital = body.registeredCapital || null;
    if (body.currencyType !== undefined) updateData.currency_type = body.currencyType;
    if (body.taxType !== undefined) updateData.tax_type = body.taxType || null;
    if (body.expectedAnnualRevenue !== undefined) updateData.expected_annual_revenue = body.expectedAnnualRevenue || null;
    if (body.expectedAnnualTax !== undefined) updateData.expected_annual_tax = body.expectedAnnualTax || null;
    if (body.originalRegisteredAddress !== undefined) updateData.original_registered_address = body.originalRegisteredAddress || null;
    if (body.mailingAddress !== undefined) updateData.mailing_address = body.mailingAddress || null;
    if (body.businessAddress !== undefined) updateData.business_address = body.businessAddress || null;
    if (body.assignedAddressId !== undefined) updateData.assigned_address_id = body.assignedAddressId || null;
    if (body.assignedAddress !== undefined) updateData.assigned_address = body.assignedAddress || null;
    if (body.personnel !== undefined) updateData.personnel = body.personnel;
    if (body.shareholders !== undefined) updateData.shareholders = body.shareholders;
    if (body.ewtContactName !== undefined) updateData.ewt_contact_name = body.ewtContactName || null;
    if (body.ewtContactPhone !== undefined) updateData.ewt_contact_phone = body.ewtContactPhone || null;
    if (body.intermediaryDepartment !== undefined) updateData.intermediary_department = body.intermediaryDepartment || null;
    if (body.intermediaryName !== undefined) updateData.intermediary_name = body.intermediaryName || null;
    if (body.intermediaryPhone !== undefined) updateData.intermediary_phone = body.intermediaryPhone || null;
    if (body.businessScope !== undefined) updateData.business_scope = body.businessScope || null;
    if (body.applicationType !== undefined) updateData.application_type = body.applicationType || null;
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.approvalStatus !== undefined) updateData.approval_status = body.approvalStatus;

    const { data, error } = await client
      .from('pi_settlement_applications')
      .update(updateData)
      .eq('id', id)
      .select('id, application_no')
      .single();

    if (error) {
      console.error('更新申请失败:', error);
      return NextResponse.json(
        { success: false, error: error.message || '更新申请失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        applicationNo: data.application_no,
      },
    });
  } catch (error) {
    console.error('更新申请异常:', error);
    return NextResponse.json(
      { success: false, error: '更新申请失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications/[id]
 * 删除入驻申请
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { error } = await client
      .from('pi_settlement_applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除申请失败:', error);
      return NextResponse.json(
        { success: false, error: error.message || '删除申请失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除申请异常:', error);
    return NextResponse.json(
      { success: false, error: '删除申请失败' },
      { status: 500 }
    );
  }
}
