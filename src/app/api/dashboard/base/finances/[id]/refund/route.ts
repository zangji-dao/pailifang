import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 资金返还
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const { amount, refund_method, remarks } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "返还金额必须大于0" }, { status: 400 });
    }

    // 获取资金记录
    const { data: finance, error: financeError } = await supabase
      .from('finances')
      .select('*')
      .eq('id', id)
      .single();

    if (financeError || !finance) {
      return NextResponse.json({ error: "资金记录不存在" }, { status: 404 });
    }

    const financeData = finance as Record<string, unknown>;

    // 检查状态
    if (financeData.status === "pending") {
      return NextResponse.json({ error: "资金尚未收取，无法返还" }, { status: 400 });
    }

    if (financeData.status === "refunded") {
      return NextResponse.json({ error: "资金已全部返还" }, { status: 400 });
    }

    // 检查返还金额
    const currentRefunded = parseFloat(financeData.refunded_amount as string) || 0;
    const totalAmount = parseFloat(financeData.amount as string);
    const remainingAmount = totalAmount - currentRefunded;

    if (amount > remainingAmount) {
      return NextResponse.json({ 
        error: `返还金额不能超过剩余可返还金额 ${remainingAmount.toFixed(2)} 元` 
      }, { status: 400 });
    }

    // 创建返还记录
    const { data: refund, error: refundError } = await supabase
      .from('finance_refunds')
      .insert({
        finance_id: id,
        amount,
        refund_method: refund_method || null,
        remarks: remarks || null,
      })
      .select()
      .single();

    if (refundError) {
      console.error("创建返还记录失败:", refundError);
      return NextResponse.json({ error: "返还失败" }, { status: 500 });
    }

    // 更新资金记录
    const newRefundedAmount = currentRefunded + amount;
    const newStatus = newRefundedAmount >= totalAmount ? "refunded" : "partial_refund";

    const { data: updatedFinance, error: updateError } = await supabase
      .from('finances')
      .update({
        refunded_amount: newRefundedAmount,
        status: newStatus,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("更新资金记录失败:", updateError);
      return NextResponse.json({ error: "返还失败" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        finance: updatedFinance,
        refund,
      },
      message: newStatus === "refunded" ? "资金已全部返还" : "部分返还成功",
    });
  } catch (error) {
    console.error("资金返还失败:", error);
    return NextResponse.json({ error: "资金返还失败" }, { status: 500 });
  }
}

// 获取返还记录列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('finance_refunds')
      .select('*')
      .eq('finance_id', id)
      .order('refunded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: "获取返还记录失败" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("获取返还记录失败:", error);
    return NextResponse.json({ error: "获取返还记录失败" }, { status: 500 });
  }
}
