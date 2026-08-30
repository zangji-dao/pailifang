import config from '@/config';
import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

type UtilityType = 'electricity' | 'water';

interface AlipayBillQueryResult {
  success: boolean;
  code?: string;
  error?: string;
  data?: {
    balance: string | null;
    amount: string | null;
    bills: Array<{
      billDate: string | null;
      billStatus: string | null;
      ownerName: string | null;
      balance: string | null;
      amount: string | null;
    }>;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { type?: UtilityType };
    const utilityType = body.type;

    if (!utilityType || !['electricity', 'water'].includes(utilityType)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_UTILITY_TYPE', error: '请选择正确的水电账户类型。' },
        { status: 400 }
      );
    }

    const database = createClient();
    const { data: meter, error: meterError } = await database
      .from('meters')
      .select('id, electricity_enabled, electricity_number, electricity_charge_inst, water_enabled, water_number, water_charge_inst')
      .eq('id', id)
      .single();

    if (meterError || !meter) {
      return NextResponse.json(
        { success: false, code: 'METER_NOT_FOUND', error: '物业不存在。' },
        { status: 404 }
      );
    }

    const isElectricity = utilityType === 'electricity';
    const utilityEnabled = isElectricity ? meter.electricity_enabled : meter.water_enabled;
    const billKey = isElectricity ? meter.electricity_number : meter.water_number;
    const chargeInst = isElectricity ? meter.electricity_charge_inst : meter.water_charge_inst;

    if (!utilityEnabled) {
      return NextResponse.json(
        { success: false, code: 'UTILITY_NOT_ENABLED', error: `该物业未启用${isElectricity ? '电费' : '水费'}管理。` },
        { status: 400 }
      );
    }

    if (!billKey) {
      return NextResponse.json(
        { success: false, code: 'UTILITY_ACCOUNT_MISSING', error: `请先填写${isElectricity ? '电费' : '水费'}户号。` },
        { status: 400 }
      );
    }

    if (!chargeInst) {
      return NextResponse.json(
        { success: false, code: 'CHARGE_INST_MISSING', error: '请先填写支付宝生活缴费收费机构编码并保存。' },
        { status: 400 }
      );
    }

    const alipayResponse = await fetch(`${config.backend.baseUrl}/api/alipay/bill/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        billKey,
        chargeInst,
        billType: isElectricity ? 'ELECTRIC' : 'WATER',
      }),
    });
    const result = await alipayResponse.json() as AlipayBillQueryResult;

    if (!alipayResponse.ok || !result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          code: result.code || 'ALIPAY_UTILITY_BILL_QUERY_FAILED',
          error: result.error || '支付宝生活缴费查询失败。',
        },
        { status: alipayResponse.status || 502 }
      );
    }

    const numericBalance = result.data.balance === null ? null : Number(result.data.balance);
    if (numericBalance !== null && !Number.isFinite(numericBalance)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_BALANCE_RESPONSE', error: '收费机构返回的余额格式不正确。' },
        { status: 502 }
      );
    }

    const updatedAt = new Date().toISOString();
    if (numericBalance !== null) {
      const balanceField = isElectricity ? 'electricity_balance' : 'water_balance';
      const updatedAtField = isElectricity ? 'electricity_balance_updated_at' : 'water_balance_updated_at';
      const { error: updateError } = await database
        .from('meters')
        .update({
          [balanceField]: numericBalance,
          [updatedAtField]: updatedAt,
          updated_at: updatedAt,
        })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { success: false, code: 'BALANCE_UPDATE_FAILED', error: `余额已查询，但保存失败：${updateError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type: utilityType,
        balance: numericBalance,
        amount: result.data.amount === null ? null : Number(result.data.amount),
        bill: result.data.bills[0] || null,
        updatedAt: numericBalance === null ? null : updatedAt,
        source: 'alipay',
      },
      message: numericBalance === null
        ? '已取得收费机构账单，但该机构本次未返回账户余额。'
        : '支付宝余额同步成功。',
    });
  } catch (error) {
    console.error('同步支付宝水电余额失败:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'UTILITY_BALANCE_SYNC_FAILED',
        error: error instanceof Error ? error.message : '同步支付宝水电余额失败。',
      },
      { status: 500 }
    );
  }
}
