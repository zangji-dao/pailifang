import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST /api/applications/[id]/reject
 * 驳回入驻申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { rejectionReason, approvedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少申请ID' },
        { status: 400 }
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { success: false, error: '请填写驳回原因' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查申请是否存在且状态为待审批
    const { data: application, error: appError } = await client
      .from('pi_settlement_applications')
      .select('id, application_no, enterprise_name, approval_status')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: '申请不存在' },
        { status: 404 }
      );
    }

    if (application.approval_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '只能驳回待审批状态的申请' },
        { status: 400 }
      );
    }

    // 更新审批状态
    const { error: updateError } = await client
      .from('pi_settlement_applications')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: approvedBy || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('驳回失败:', updateError);
      return NextResponse.json(
        { success: false, error: '驳回失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        approvalStatus: 'rejected',
        rejectionReason,
        rejectedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('驳回异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
