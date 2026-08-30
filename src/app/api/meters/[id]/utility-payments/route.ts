import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/server';

const utilityTypes = ['electricity', 'water'] as const;
const paymentStatuses = ['pending', 'paid', 'arrears'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const utilityType = String(body.utilityType || '');
    const billingPeriod = String(body.billingPeriod || '').trim();
    const amount = Number(body.amount);
    const status = String(body.status || 'pending');

    if (!utilityTypes.includes(utilityType as typeof utilityTypes[number])) {
      return NextResponse.json({ success: false, error: '不支持的缴费类型' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}$/.test(billingPeriod)) {
      return NextResponse.json({ success: false, error: '账期格式应为 YYYY-MM' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ success: false, error: '请输入正确的账单金额' }, { status: 400 });
    }
    if (!paymentStatuses.includes(status as typeof paymentStatuses[number])) {
      return NextResponse.json({ success: false, error: '不支持的账单状态' }, { status: 400 });
    }

    const { data: meter, error: meterError } = await supabase
      .from('meters')
      .select('id,electricity_number,electricity_provider,water_number,water_provider')
      .eq('id', id)
      .single();

    if (meterError || !meter) {
      return NextResponse.json({ success: false, error: '物业不存在' }, { status: 404 });
    }

    const isElectricity = utilityType === 'electricity';
    const provider = String(
      body.provider || (isElectricity ? meter.electricity_provider : meter.water_provider) || ''
    ).trim();
    const accountNumber = String(
      body.accountNumber || (isElectricity ? meter.electricity_number : meter.water_number) || ''
    ).trim();
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
        utility_type: utilityType,
        billing_period: billingPeriod,
        provider: provider || null,
        account_number: accountNumber || null,
        charge_type: 'bill',
        quantity,
        quantity_unit: isElectricity ? 'kWh' : 'm³',
        unit_price: unitPrice,
        amount,
        status,
        paid_at: status === 'paid' ? now : null,
        payment_method: String(body.paymentMethod || '').trim() || null,
        receipt_number: String(body.receiptNumber || '').trim() || null,
        metadata: {
          source: 'manual',
          recordedAt: now,
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
      { status: 500 }
    );
  }
}
