import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 同步余额接口 - 模拟支付宝余额同步
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const { type } = body; // 'electricity' or 'water'

    if (!type || !['electricity', 'water'].includes(type)) {
      return NextResponse.json(
        { success: false, error: "无效的表类型" },
        { status: 400 }
      );
    }

    // 查询物业信息获取表号
    const { data: meter, error: fetchError } = await supabase
      .from('meters')
      .select('id, electricity_number, water_number')
      .eq('id', id)
      .single();

    if (fetchError || !meter) {
      return NextResponse.json(
        { success: false, error: "物业不存在" },
        { status: 404 }
      );
    }

    const meterNumber = type === 'electricity' 
      ? meter.electricity_number 
      : meter.water_number;

    if (!meterNumber) {
      return NextResponse.json(
        { success: false, error: `请先填写${type === 'electricity' ? '电表号' : '水表号'}` },
        { status: 400 }
      );
    }

    // 模拟支付宝余额查询
    // 实际项目中这里应该调用支付宝API获取真实余额
    // 这里使用模拟数据：随机生成50-500之间的余额
    const mockBalance = Math.round((Math.random() * 450 + 50) * 100) / 100;

    // 更新数据库
    const balanceField = type === 'electricity' 
      ? 'electricity_balance' 
      : 'water_balance';
    const updatedAtField = type === 'electricity' 
      ? 'electricity_balance_updated_at' 
      : 'water_balance_updated_at';

    const { error: updateError } = await supabase
      .from('meters')
      .update({
        [balanceField]: mockBalance,
        [updatedAtField]: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error("更新余额失败:", updateError);
      return NextResponse.json(
        { success: false, error: "更新余额失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: mockBalance,
        type,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("同步余额失败:", error);
    return NextResponse.json(
      { success: false, error: "同步余额失败" },
      { status: 500 }
    );
  }
}
