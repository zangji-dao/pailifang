import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/applications/list
 * 获取入驻申请列表（包含附件信息）
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    
    // 可选的状态筛选
    const status = searchParams.get('status');
    
    let query = client
      .from('pi_settlement_applications')
      .select('id, application_no, application_date, enterprise_name, enterprise_name_backups, application_type, approval_status, approved_at, rejection_reason, assigned_address, legal_person_name, legal_person_phone, contact_person_name, registered_capital, business_scope, created_at, status, attachments')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('approval_status', status);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('获取申请列表失败:', error);
      return NextResponse.json(
        { success: false, error: error.message || '获取申请列表失败' },
        { status: 500 }
      );
    }

    // 转换字段名为驼峰格式
    const formattedData = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      applicationNo: item.application_no,
      applicationDate: item.application_date,
      enterpriseName: item.enterprise_name,
      enterpriseNameBackups: item.enterprise_name_backups,
      applicationType: item.application_type,
      approvalStatus: item.approval_status,
      approvedAt: item.approved_at,
      rejectionReason: item.rejection_reason,
      assignedAddress: item.assigned_address,
      legalPersonName: item.legal_person_name,
      legalPersonPhone: item.legal_person_phone,
      contactPersonName: item.contact_person_name,
      registeredCapital: item.registered_capital,
      businessScope: item.business_scope,
      createdAt: item.created_at,
      status: item.status,
      attachments: item.attachments || [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('获取申请列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取申请列表失败' },
      { status: 500 }
    );
  }
}
