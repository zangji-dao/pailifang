import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

const billingCycles = ['monthly', 'annual'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
    let query = supabase
      .from('base_fee_types')
      .select('*')
      .eq('base_id', id)
      .order('sort_order');
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: '获取费用类型失败: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取费用类型失败:', error);
    return NextResponse.json({ success: false, error: '获取费用类型失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name || '').trim();
    const billingCycle = String(body.billingCycle || 'monthly');
    if (!name || name.length > 100) {
      return NextResponse.json({ success: false, error: '请输入100字以内的费用类型名称' }, { status: 400 });
    }
    if (!billingCycles.includes(billingCycle as typeof billingCycles[number])) {
      return NextResponse.json({ success: false, error: '计费周期不正确' }, { status: 400 });
    }
    const { data: duplicate } = await supabase
      .from('base_fee_types')
      .select('id')
      .eq('base_id', id)
      .eq('name', name)
      .limit(1);
    if (duplicate && duplicate.length > 0) {
      return NextResponse.json({ success: false, error: '当前基地已存在同名费用类型' }, { status: 400 });
    }
    const { data: lastFeeType } = await supabase
      .from('base_fee_types')
      .select('sort_order')
      .eq('base_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    const { data, error } = await supabase
      .from('base_fee_types')
      .insert({
        id: crypto.randomUUID(),
        base_id: id,
        code: `custom_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`,
        name,
        billing_cycle: billingCycle,
        is_builtin: false,
        is_active: true,
        sort_order: Number(lastFeeType?.sort_order || 0) + 10,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ success: false, error: '新增费用类型失败: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('新增费用类型失败:', error);
    return NextResponse.json({ success: false, error: '新增费用类型失败' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const feeTypeId = String(body.feeTypeId || '').trim();
    if (!feeTypeId) {
      return NextResponse.json({ success: false, error: '缺少费用类型ID' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name || name.length > 100) {
        return NextResponse.json({ success: false, error: '请输入100字以内的费用类型名称' }, { status: 400 });
      }
      updateData.name = name;
    }
    if (body.billingCycle !== undefined) {
      const billingCycle = String(body.billingCycle);
      if (!billingCycles.includes(billingCycle as typeof billingCycles[number])) {
        return NextResponse.json({ success: false, error: '计费周期不正确' }, { status: 400 });
      }
      updateData.billing_cycle = billingCycle;
    }
    if (body.isActive !== undefined) updateData.is_active = Boolean(body.isActive);
    const { data, error } = await supabase
      .from('base_fee_types')
      .update(updateData)
      .eq('id', feeTypeId)
      .eq('base_id', id)
      .select()
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: '更新费用类型失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新费用类型失败:', error);
    return NextResponse.json({ success: false, error: '更新费用类型失败' }, { status: 500 });
  }
}
