import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/spaces/available
 * 获取所有空间列表（用于生成注册号时选择）
 */
export async function GET() {
  try {
    const supabase = createClient();

    // 1. 查询所有空间
    const { data: spaces, error: spaceError } = await supabase
      .from('spaces')
      .select('id, code, name, area, meter_id')
      .order('code', { ascending: true });

    if (spaceError) {
      console.error('获取空间失败:', spaceError);
      return NextResponse.json({ success: false, error: '获取空间失败' }, { status: 500 });
    }

    if (!spaces || spaces.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. 获取所有物业ID
    const meterIds = spaces.map(s => s.meter_id).filter(Boolean);

    // 3. 查询物业信息
    const { data: meters, error: meterError } = await supabase
      .from('meters')
      .select('id, code, name, base_id')
      .in('id', meterIds);

    if (meterError) {
      console.error('获取物业信息失败:', meterError);
    }

    // 4. 获取所有基地ID
    const baseIds = (meters || []).map(m => m.base_id).filter(Boolean);

    // 5. 查询基地信息
    const { data: bases, error: baseError } = await supabase
      .from('bases')
      .select('id, name')
      .in('id', baseIds);

    if (baseError) {
      console.error('获取基地信息失败:', baseError);
    }

    // 6. 组装数据
    const formattedData = spaces.map((space) => {
      const meter = (meters || []).find(m => m.id === space.meter_id);
      const base = meter ? (bases || []).find(b => b.id === meter.base_id) : null;

      return {
        id: space.id,
        code: space.code,
        name: space.name,
        area: space.area,
        meter: {
          id: meter?.id || '',
          code: meter?.code || '',
          name: meter?.name || '',
          base: {
            id: base?.id || '',
            name: base?.name || '',
          },
        },
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取空间失败:', error);
    return NextResponse.json({ success: false, error: '获取空间失败' }, { status: 500 });
  }
}
