import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bases/spaces/available
 * 获取可用房间列表（带有可用工位号的房间）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 查询所有房间
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select(`
        id,
        code,
        name,
        area,
        status,
        base_id,
        bases (
          id,
          name
        )
      `)
      .eq('status', 'available')
      .order('code', { ascending: true });

    if (spacesError) {
      console.error('查询房间失败:', spacesError);
      // 如果查询失败，返回空数组而不是错误
      return NextResponse.json({
        success: true,
        data: [],
        message: '暂无可用房间，请使用手动输入地址',
      });
    }

    // 查询每个房间的工位号
    const spacesWithRegs = await Promise.all(
      (spaces || []).map(async (space: any) => {
        const { data: regNumbers, error: regError } = await supabase
          .from('registration_numbers')
          .select('id, code, available')
          .eq('space_id', space.id);

        if (regError) {
          console.error('查询工位号失败:', regError);
          return {
            ...space,
            baseName: space.bases?.name || '未知基地',
            regNumbers: [],
          };
        }

        return {
          ...space,
          baseName: space.bases?.name || '未知基地',
          regNumbers: regNumbers || [],
        };
      })
    );

    // 过滤出有可用工位号的房间
    const availableSpaces = spacesWithRegs.filter(
      (space) => space.regNumbers?.some((r: any) => r.available)
    );

    return NextResponse.json({
      success: true,
      data: availableSpaces,
    });
  } catch (error) {
    console.error('获取可用房间失败:', error);
    return NextResponse.json(
      { success: false, error: '获取可用房间失败' },
      { status: 500 }
    );
  }
}
