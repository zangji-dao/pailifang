import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 生成申请编号
 * 格式: RSA + 年月日 + 4位序号
 */
function generateApplicationNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `RSA${year}${month}${day}${random}`;
}

/**
 * POST /api/applications/draft
 * 保存入驻申请草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 如果有 id，则更新现有记录
    if (body.id) {
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
        application_type: body.applicationType || 'new',
        remarks: body.remarks || null,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('pi_settlement_applications')
        .update(updateData)
        .eq('id', body.id)
        .select('id, application_no')
        .single();

      if (error) {
        console.error('更新草稿失败:', error);
        return NextResponse.json(
          { success: false, error: error.message || '更新草稿失败' },
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
    }

    // 新建草稿
    const applicationNo = generateApplicationNo();
    const insertData = {
      application_no: applicationNo,
      application_date: new Date().toISOString().split('T')[0],
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
      application_type: body.applicationType || 'new',
      remarks: body.remarks || null,
      status: 'draft',
      approval_status: 'draft',
    };

    const { data, error } = await client
      .from('pi_settlement_applications')
      .insert(insertData)
      .select('id, application_no')
      .single();

    if (error) {
      console.error('创建草稿失败:', error);
      return NextResponse.json(
        { success: false, error: error.message || '创建草稿失败' },
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
    console.error('保存草稿异常:', error);
    return NextResponse.json(
      { success: false, error: '保存草稿失败，请稍后重试' },
      { status: 500 }
    );
  }
}
