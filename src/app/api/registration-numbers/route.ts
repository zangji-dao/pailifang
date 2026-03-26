import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/registration-numbers
 * 获取所有工位号列表
 */
export async function GET() {
  try {
    const supabase = createClient();

    // 1. 查询所有工位号
    const { data: regNumbers, error: regError } = await supabase
      .from('registration_numbers')
      .select('id, code, manual_code, property_owner, management_company, assigned_enterprise_name, available, space_id, enterprise_id, created_at')
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('获取工位号失败:', regError);
      return NextResponse.json({ success: false, error: '获取工位号失败' }, { status: 500 });
    }

    if (!regNumbers || regNumbers.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. 获取所有空间ID
    const spaceIds = regNumbers.map(r => r.space_id).filter(Boolean);

    // 3. 查询空间信息
    const { data: spaces, error: spaceError } = await supabase
      .from('spaces')
      .select('id, code, name, area, meter_id')
      .in('id', spaceIds);

    if (spaceError) {
      console.error('获取空间信息失败:', spaceError);
    }

    // 4. 获取所有物业ID
    const meterIds = (spaces || []).map(s => s.meter_id).filter(Boolean);

    // 5. 查询物业信息
    const { data: meters, error: meterError } = await supabase
      .from('meters')
      .select('id, code, name, base_id')
      .in('id', meterIds);

    if (meterError) {
      console.error('获取物业信息失败:', meterError);
    }

    // 6. 获取所有基地ID
    const baseIds = (meters || []).map(m => m.base_id).filter(Boolean);

    // 7. 查询基地信息
    const { data: bases, error: baseError } = await supabase
      .from('bases')
      .select('id, name, address, address_template')
      .in('id', baseIds);

    if (baseError) {
      console.error('获取基地信息失败:', baseError);
    }

    // 8. 查询关联的申请（通过 assigned_address_id 反查）
    const regIds = regNumbers.map(r => r.id);
    const { data: applications, error: appError } = await supabase
      .from('pi_settlement_applications')
      .select('id, assigned_address_id, enterprise_name')
      .in('assigned_address_id', regIds);

    if (appError) {
      console.error('获取申请信息失败:', appError);
    }

    // 9. 组装数据
    const formattedData = regNumbers.map((reg) => {
      const space = (spaces || []).find(s => s.id === reg.space_id);
      const meter = space ? (meters || []).find(m => m.id === space.meter_id) : null;
      const base = meter ? (bases || []).find(b => b.id === meter.base_id) : null;
      const application = (applications || []).find(a => a.assigned_address_id === reg.id);

      return {
        id: reg.id,
        code: reg.code,
        manual_code: reg.manual_code,
        property_owner: reg.property_owner,
        management_company: reg.management_company,
        assigned_enterprise_name: reg.assigned_enterprise_name,
        available: reg.available,
        enterprise_id: reg.enterprise_id,
        created_at: reg.created_at,
        application_id: application?.id || null, // 关联的申请ID
        space: {
          id: space?.id || '',
          code: space?.code || '',
          name: space?.name || '',
          area: space?.area || null,
          meter: {
            id: meter?.id || '',
            code: meter?.code || '',
            name: meter?.name || '',
            base: {
              id: base?.id || '',
              name: base?.name || '',
              address: base?.address || null,
              address_template: base?.address_template || null,
            },
          },
        },
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取工位号失败:', error);
    return NextResponse.json({ success: false, error: '获取工位号失败' }, { status: 500 });
  }
}

/**
 * POST /api/registration-numbers
 * 创建工位号
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { space_id, code, assigned_enterprise_name, available } = body;

    if (!space_id || !code) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：space_id 和 code' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('registration_numbers')
      .insert({
        id: crypto.randomUUID(),
        space_id,
        code,
        assigned_enterprise_name: assigned_enterprise_name || null,
        available: available !== undefined ? available : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建工位号失败:', error);
      return NextResponse.json(
        { success: false, error: '创建工位号失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('创建工位号失败:', error);
    return NextResponse.json(
      { success: false, error: '创建工位号失败' },
      { status: 500 }
    );
  }
}
