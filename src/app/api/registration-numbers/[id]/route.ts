import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/registration-numbers/[id]
 * 更新工位号信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const { manual_code, property_owner, management_company, assigned_enterprise_name } = body;

    // 更新工位号
    const { data, error } = await supabase
      .from('registration_numbers')
      .update({
        manual_code: manual_code || null,
        property_owner: property_owner || null,
        management_company: management_company || null,
        assigned_enterprise_name: assigned_enterprise_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新工位号失败:', error);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新工位号失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

/**
 * GET /api/registration-numbers/[id]
 * 获取单个工位号详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('registration_numbers')
      .select(`
        id,
        code,
        manual_code,
        property_owner,
        management_company,
        available,
        enterprise_id,
        created_at,
        space_id,
        spaces (
          id,
          code,
          name,
          meter_id,
          meters (
            id,
            code,
            name,
            base_id,
            bases (
              id,
              name,
              address
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取工位号失败:', error);
      return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取工位号失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
