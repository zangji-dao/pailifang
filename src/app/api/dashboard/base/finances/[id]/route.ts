import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 获取单个资金记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "资金记录不存在" }, { status: 404 });
    }

    // 获取关联的企业和基地信息
    let enterprise = null;
    let site = null;

    if (data.enterprise_id) {
      const { data: enterpriseData } = await supabase
        .from('enterprises')
        .select('id, name, credit_code')
        .eq('id', data.enterprise_id)
        .single();
      enterprise = enterpriseData;
    }

    if (data.site_id) {
      const { data: siteData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('id', data.site_id)
        .single();
      site = siteData;
    }

    // 获取返还记录
    const { data: refunds } = await supabase
      .from('finance_refunds')
      .select('*')
      .eq('finance_id', id)
      .order('refunded_at', { ascending: false });

    // 格式化数据
    const formattedData = {
      ...data,
      enterprise_name: enterprise?.name || '',
      enterprise_credit_code: enterprise?.credit_code || null,
      site_name: site?.name || null,
      refunds: refunds || [],
    };

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("获取资金记录失败:", error);
    return NextResponse.json({ error: "获取资金记录失败" }, { status: 500 });
  }
}

// 更新资金记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const {
      type,
      deposit_type,
      item_name,
      amount,
      payment_method,
      status,
      paid_at,
      remarks,
      site_id,
    } = body;

    // 构建更新对象
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (type !== undefined) updateData.type = type;
    if (deposit_type !== undefined) updateData.deposit_type = deposit_type;
    if (item_name !== undefined) updateData.item_name = item_name;
    if (amount !== undefined) updateData.amount = amount;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (status !== undefined) {
      updateData.status = status;
      // 如果状态变为已收取，设置收取时间
      if (status === "paid" && !paid_at) {
        updateData.paid_at = new Date().toISOString();
      }
    }
    if (paid_at !== undefined) updateData.paid_at = paid_at;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (site_id !== undefined) updateData.site_id = site_id;

    const { data, error } = await supabase
      .from('finances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "资金记录不存在或更新失败" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("更新资金记录失败:", error);
    return NextResponse.json({ error: "更新资金记录失败" }, { status: 500 });
  }
}

// 删除资金记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 检查是否有返还记录
    const { data: refunds } = await supabase
      .from('finance_refunds')
      .select('id')
      .eq('finance_id', id);

    if (refunds && refunds.length > 0) {
      return NextResponse.json({ error: "存在返还记录，无法删除" }, { status: 400 });
    }

    const { error } = await supabase
      .from('finances')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: "资金记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除资金记录失败:", error);
    return NextResponse.json({ error: "删除资金记录失败" }, { status: 500 });
  }
}
