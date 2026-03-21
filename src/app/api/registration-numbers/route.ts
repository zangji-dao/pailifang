import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/registration-numbers
 * 获取所有注册号列表
 */
export async function GET() {
  try {
    const supabase = createClient();

    // 1. 查询所有注册号
    const { data: regNumbers, error: regError } = await supabase
      .from('registration_numbers')
      .select('id, code, available, space_id, enterprise_id, created_at')
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('获取注册号失败:', regError);
      return NextResponse.json({ success: false, error: '获取注册号失败' }, { status: 500 });
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
      .select('id, name')
      .in('id', baseIds);

    if (baseError) {
      console.error('获取基地信息失败:', baseError);
    }

    // 8. 组装数据
    const formattedData = regNumbers.map((reg) => {
      const space = (spaces || []).find(s => s.id === reg.space_id);
      const meter = space ? (meters || []).find(m => m.id === space.meter_id) : null;
      const base = meter ? (bases || []).find(b => b.id === meter.base_id) : null;

      return {
        id: reg.id,
        code: reg.code,
        available: reg.available,
        enterprise_id: reg.enterprise_id,
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
            },
          },
        },
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取注册号失败:', error);
    return NextResponse.json({ success: false, error: '获取注册号失败' }, { status: 500 });
  }
}
