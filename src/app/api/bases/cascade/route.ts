import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/bases/cascade
 * 获取基地-物业-物理空间级联数据（包含工位号）
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

    // 4. 获取所有工位号
    const spaceIds = (spaces || []).map(s => s.id);
    const { data: regNumbers, error: regError } = await supabase
      .from('registration_numbers')
      .select('id, code, space_id, enterprise_id, available')
      .in('space_id', spaceIds);

    if (regError) {
      console.error('获取工位号失败:', regError);
    }

    // 5. 构建级联数据结构
    const cascadeData = (bases || []).map(base => {
      const baseMeters = (meters || [])
        .filter(m => m.base_id === base.id)
        .map(meter => {
          const meterSpaces = (spaces || [])
            .filter(s => s.meter_id === meter.id)
            .map(space => {
              // 获取该空间的工位号
              const spaceRegNumbers = (regNumbers || [])
                .filter(r => r.space_id === space.id)
                .map(r => ({
                  id: r.id,
                  code: r.code,
                  available: r.available,
                  enterprise_id: r.enterprise_id,
                }));

              return {
                id: space.id,
                code: space.code,
                name: space.name,
                area: space.area,
                status: space.status,
                isOccupied: !!space.enterprise_id,
                regNumbers: spaceRegNumbers,
              };
            });

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
