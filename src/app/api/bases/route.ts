import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/bases
 * 获取所有基地列表（包含管理公司信息）
 */
export async function GET() {
  try {
    const supabase = createClient();

    const { data: bases, error } = await supabase
      .from('bases')
      .select(`
        id,
        name,
        address,
        status,
        created_at,
        updated_at,
        management_company_name,
        management_company_credit_code,
        management_company_legal_person,
        management_company_address,
        management_company_phone
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取基地列表失败:', error);
      return NextResponse.json({ success: false, error: '获取基地列表失败' }, { status: 500 });
    }

    // 获取每个基地的物业数量
    const { data: metersCount, error: countError } = await supabase
      .from('meters')
      .select('base_id');

    if (countError) {
      console.error('获取物业数量失败:', countError);
    }

    // 统计每个基地的物业数量
    const meterCountMap: Record<string, number> = {};
    (metersCount || []).forEach((m: { base_id: string }) => {
      meterCountMap[m.base_id] = (meterCountMap[m.base_id] || 0) + 1;
    });

    // 组装数据
    const result = (bases || []).map(base => ({
      ...base,
      meterCount: meterCountMap[base.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取基地列表失败:', error);
    return NextResponse.json({ success: false, error: '获取基地列表失败' }, { status: 500 });
  }
}

/**
 * POST /api/bases
 * 创建基地
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('bases')
      .insert({
        id: crypto.randomUUID(),
        name: body.name,
        address: body.address || null,
        status: body.status || 'active',
        management_company_name: body.management_company_name || null,
        management_company_credit_code: body.management_company_credit_code || null,
        management_company_legal_person: body.management_company_legal_person || null,
        management_company_address: body.management_company_address || null,
        management_company_phone: body.management_company_phone || null,
      })
      .select()
      .single();

    if (error) {
      console.error('创建基地失败:', error);
      return NextResponse.json({ success: false, error: '创建基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建基地失败:', error);
    return NextResponse.json({ success: false, error: '创建基地失败' }, { status: 500 });
  }
}
