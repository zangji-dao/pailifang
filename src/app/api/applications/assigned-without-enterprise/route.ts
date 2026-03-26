import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/applications/assigned-without-enterprise
 * 获取已分配地址但未创建企业档案的申请
 * 条件：
 * 1. approval_status = 'approved'
 * 2. assigned_address_id IS NOT NULL
 * 3. enterprise_id IS NULL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 简化查询，不使用复杂关联
    const { data, error } = await supabase
      .from('pi_settlement_applications')
      .select(`
        id,
        application_no,
        enterprise_name,
        legal_person_name,
        legal_person_phone,
        contact_person_name,
        contact_person_phone,
        registered_capital,
        business_scope,
        assigned_address_id,
        assigned_address,
        application_type,
        settlement_type,
        created_at
      `)
      .eq('approval_status', 'approved')
      .not('assigned_address_id', 'is', null)
      .is('enterprise_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取已分配地址申请失败:', error);
      return NextResponse.json(
        { success: false, error: '获取数据失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('获取已分配地址申请失败:', error);
    return NextResponse.json(
      { success: false, error: '获取数据失败: ' + (error.message || '未知错误') },
      { status: 500 }
    );
  }
}
