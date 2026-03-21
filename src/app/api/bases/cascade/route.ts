import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/bases/cascade
 * 获取基地-物业-物理空间级联数据
 */
export async function GET() {
  try {
    const supabase = createClient();

    // 1. 获取所有基地
    const { data: bases, error: basesError } = await supabase
      .from('bases')
      .select('id, name, address, status')
      .eq('status', 'active')
      .order('name');

    if (basesError) {
      console.error('获取基地失败:', basesError);
      return NextResponse.json({ success: false, error: '获取基地失败' }, { status: 500 });
    }

    // 2. 获取所有物业
    const { data: meters, error: metersError } = await supabase
      .from('meters')
      .select('id, code, name, area, status, base_id')
      .eq('status', 'active')
      .order('code');

    if (metersError) {
      console.error('获取物业失败:', metersError);
      return NextResponse.json({ success: false, error: '获取物业失败' }, { status: 500 });
    }

    // 3. 获取所有物理空间
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, code, name, area, status, meter_id, enterprise_id')
      .order('code');

    if (spacesError) {
      console.error('获取物理空间失败:', spacesError);
      return NextResponse.json({ success: false, error: '获取物理空间失败' }, { status: 500 });
    }

    // 4. 构建级联数据结构
    const cascadeData = (bases || []).map(base => {
      const baseMeters = (meters || [])
        .filter(m => m.base_id === base.id)
        .map(meter => {
          const meterSpaces = (spaces || [])
            .filter(s => s.meter_id === meter.id)
            .map(space => ({
              id: space.id,
              code: space.code,
              name: space.name,
              area: space.area,
              status: space.status,
              isOccupied: !!space.enterprise_id, // 是否已被占用
            }));

          return {
            id: meter.id,
            code: meter.code,
            name: meter.name,
            area: meter.area,
            status: meter.status,
            spaces: meterSpaces,
          };
        });

      return {
        id: base.id,
        name: base.name,
        address: base.address,
        status: base.status,
        meters: baseMeters,
      };
    });

    return NextResponse.json({
      success: true,
      data: cascadeData,
    });
  } catch (error) {
    console.error('获取级联数据失败:', error);
    return NextResponse.json({ success: false, error: '获取级联数据失败' }, { status: 500 });
  }
}
