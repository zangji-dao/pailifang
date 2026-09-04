import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/server';

const paymentStatuses = ['pending', 'paid', 'arrears'] as const;
const invoiceStatuses = ['pending', 'issued', 'not_required'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const utilityType = String(body.utilityType || '').trim();
    const billingPeriod = String(body.billingPeriod || '').trim();
    const amount = Number(body.amount);
    const status = String(body.status || 'pending');

    const { data: meter, error: meterError } = await supabase
      .from('meters')
      .select('id, base_id')
      .eq('id', id)
      .single();
    if (meterError || !meter) {
      return NextResponse.json({ success: false, error: '物业不存在' }, { status: 404 });
    }

    const { data: feeType, error: feeTypeError } = await supabase
      .from('base_fee_types')
      .select('id, code, name, billing_cycle, is_active')
      .eq('base_id', meter.base_id)
      .eq('code', utilityType)
      .single();
    if (feeTypeError || !feeType || !feeType.is_active) {
      return NextResponse.json({ success: false, error: '当前基地未启用该费用类型' }, { status: 400 });
    }

    const { data: feeConfig, error: feeConfigError } = await supabase
      .from('meter_fee_configs')
      .select('enabled, responsibility_type, enterprise_id, account_number, provider')
      .eq('meter_id', id)
      .eq('fee_type_id', feeType.id)
      .single();
    if (feeConfigError || !feeConfig?.enabled) {
      return NextResponse.json({ success: false, error: `请先在物业信息中启用${feeType.name}` }, { status: 400 });
    }

    const monthlyUtility = feeType.billing_cycle === 'monthly';
    const validBillingPeriod = monthlyUtility
      ? /^\d{4}-\d{2}$/.test(billingPeriod)
      : /^\d{4}(?:-\d{4})?$/.test(billingPeriod);
    if (!validBillingPeriod) {
      return NextResponse.json({ success: false, error: monthlyUtility ? '账期格式应为 YYYY-MM' : '年度格式应为 YYYY 或 YYYY-YYYY' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ success: false, error: '请输入正确的账单金额' }, { status: 400 });
    }
    if (!paymentStatuses.includes(status as typeof paymentStatuses[number])) {
      return NextResponse.json({ success: false, error: '不支持的账单状态' }, { status: 400 });
    }
    const invoiceStatus = String(body.invoiceStatus || (status === 'paid' ? 'pending' : 'not_required'));
    if (!invoiceStatuses.includes(invoiceStatus as typeof invoiceStatuses[number])) {
      return NextResponse.json({ success: false, error: '不支持的发票状态' }, { status: 400 });
    }
    const dueDate = String(body.dueDate || '').trim();
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ success: false, error: '缴费截止日期格式不正确' }, { status: 400 });
    }
    if (feeConfig.responsibility_type === 'customer' && !feeConfig.enterprise_id) {
      return NextResponse.json({ success: false, error: '请先在物业信息中指定该费用的责任企业' }, { status: 400 });
    }

    const provider = String(body.provider || feeConfig.provider || '').trim();
    const accountNumber = String(body.accountNumber || feeConfig.account_number || '').trim();
    const quantity = body.quantity === '' || body.quantity === null || body.quantity === undefined
      ? null
      : Number(body.quantity);
    const unitPrice = body.unitPrice === '' || body.unitPrice === null || body.unitPrice === undefined
      ? null
      : Number(body.unitPrice);
    const now = new Date().toISOString();

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      return NextResponse.json({ success: false, error: '请输入正确的用量' }, { status: 400 });
    }
    if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
      return NextResponse.json({ success: false, error: '请输入正确的单价' }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('property_utility_payments')
      .upsert({
        meter_id: id,
        fee_type_id: feeType.id,
        utility_type: feeType.code,
        billing_period: billingPeriod,
        provider: provider || null,
        account_number: accountNumber || null,
        charge_type: feeType.billing_cycle,
        quantity,
        quantity_unit: feeType.code === 'electricity' ? 'kWh' : feeType.code === 'water' ? 'm³' : null,
        unit_price: unitPrice,
        amount,
        status,
        paid_at: status === 'paid' ? now : null,
        payment_method: String(body.paymentMethod || '').trim() || null,
        receipt_number: String(body.receiptNumber || '').trim() || null,
        metadata: {
          source: 'manual',
          recordedAt: now,
          dueDate: dueDate || null,
          invoiceStatus,
          invoiceNumber: String(body.invoiceNumber || '').trim() || null,
          feeTypeName: feeType.name,
          responsibilityType: feeConfig.responsibility_type || 'base',
          responsibleEnterpriseId: feeConfig.responsibility_type === 'customer' ? feeConfig.enterprise_id : null,
          maintainedBy: 'management_company',
        },
        updated_at: now,
      }, { onConflict: 'meter_id,utility_type,billing_period' })
      .select()
      .single();

    if (paymentError) {
      console.error('保存物业账单失败:', paymentError);
      return NextResponse.json({ success: false, error: '保存账单失败: ' + paymentError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('保存物业账单失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '保存账单失败' },
      { status: 500 },
    );
  }
}
