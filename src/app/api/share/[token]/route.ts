import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 增加 API 路由的最大运行时间
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/share/[token]
 * 获取分享的表单数据（公开访问）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const client = getSupabaseClient();

    // 查询分享链接
    const { data: shareLink, error: linkError } = await client
      .from('pi_share_links')
      .select('id, application_id, expires_at, is_used')
      .eq('token', token)
      .single();

    if (linkError || !shareLink) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (shareLink.expires_at) {
      const expiresAt = new Date(shareLink.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: '分享链接已过期' },
          { status: 400 }
        );
      }
    }

    // 获取申请数据
    const { data: application, error: appError } = await client
      .from('pi_settlement_applications')
      .select('*')
      .eq('id', shareLink.application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: '申请数据不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        applicationNo: application.application_no,
        enterpriseName: application.enterprise_name,
        enterpriseNameBackups: application.enterprise_name_backups || [],
        registeredCapital: application.registered_capital,
        currencyType: application.currency_type || 'CNY',
        taxType: application.tax_type,
        expectedAnnualRevenue: application.expected_annual_revenue,
        expectedAnnualTax: application.expected_annual_tax,
        originalRegisteredAddress: application.original_registered_address,
        mailingAddress: application.mailing_address,
        businessAddress: application.business_address,
        personnel: application.personnel || [],
        shareholders: application.shareholders || [],
        ewtContactName: application.ewt_contact_name,
        ewtContactPhone: application.ewt_contact_phone,
        intermediaryDepartment: application.intermediary_department,
        intermediaryName: application.intermediary_name,
        intermediaryPhone: application.intermediary_phone,
        businessScope: application.business_scope,
        applicationType: application.application_type,
        remarks: application.remarks,
      },
    });
  } catch (error) {
    console.error('获取分享数据异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/share/[token]
 * 更新分享的表单数据（公开访问）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    // 查询分享链接
    const { data: shareLink, error: linkError } = await client
      .from('pi_share_links')
      .select('id, application_id, expires_at, is_used')
      .eq('token', token)
      .single();

    if (linkError || !shareLink) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (shareLink.expires_at) {
      const expiresAt = new Date(shareLink.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: '分享链接已过期' },
          { status: 400 }
        );
      }
    }

    // 更新申请数据
    const updateData = {
      enterprise_name: body.enterpriseName,
      enterprise_name_backups: body.enterpriseNameBackups || [],
      registered_capital: body.registeredCapital || null,
      currency_type: body.currencyType || 'CNY',
      tax_type: body.taxType || null,
      expected_annual_revenue: body.expectedAnnualRevenue || null,
      expected_annual_tax: body.expectedAnnualTax || null,
      original_registered_address: body.originalRegisteredAddress || null,
      mailing_address: body.mailingAddress || null,
      business_address: body.businessAddress || null,
      personnel: body.personnel || [],
      shareholders: body.shareholders || [],
      ewt_contact_name: body.ewtContactName || null,
      ewt_contact_phone: body.ewtContactPhone || null,
      intermediary_department: body.intermediaryDepartment || null,
      intermediary_name: body.intermediaryName || null,
      intermediary_phone: body.intermediaryPhone || null,
      business_scope: body.businessScope || null,
      application_type: body.applicationType || null,
      remarks: body.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await client
      .from('pi_settlement_applications')
      .update(updateData)
      .eq('id', shareLink.application_id);

    if (updateError) {
      console.error('更新申请数据失败:', updateError);
      return NextResponse.json(
        { success: false, error: '保存失败' },
        { status: 500 }
      );
    }

    // 标记分享链接已使用
    await client
      .from('pi_share_links')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', shareLink.id);

    return NextResponse.json({
      success: true,
      message: '保存成功',
    });
  } catch (error) {
    console.error('更新分享数据异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
