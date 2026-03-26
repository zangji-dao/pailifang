import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 将数字转换为36进制字符串（0-9 + A-Z）
 * @param num 数字（0-1295）
 * @returns 2位36进制字符串
 */
function toBase36(num: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const high = Math.floor(num / 36);
  const low = num % 36;
  return chars[high] + chars[low];
}

/**
 * 生成随机36进制字符串
 * @returns 2位36进制随机字符串
 */
function randomBase36(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const random1 = Math.floor(Math.random() * 36);
  const random2 = Math.floor(Math.random() * 36);
  return chars[random1] + chars[random2];
}

/**
 * POST /api/registration-numbers/generate
 * 为指定的物理空间生成工位号
 * 
 * 编码规则：[年份2位][物业2位][空间2位][随机2位]
 * - 年份：当前年份后2位（数字）
 * - 物业：基地内物业序号转36进制
 * - 空间：物业内空间序号转36进制
 * - 随机：36进制随机码，确保不重复
 * 
 * 示例：260A1B3P
 *       │  │  │  └── 随机编号
 *       │  │  └──── 空间编号（第27个空间，36进制1B）
 *       │  └─────── 物业编号（第10个物业，36进制0A）
 *       └────────── 年份（2026年）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { space_id, enterprise_id, assigned_enterprise_name } = body;

    console.log('[生成工位号] 请求参数:', { space_id, enterprise_id, assigned_enterprise_name });

    if (!space_id) {
      return NextResponse.json(
        { success: false, error: '请选择物理空间' },
        { status: 400 }
      );
    }

    if (!assigned_enterprise_name || !assigned_enterprise_name.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入预分配企业名称' },
        { status: 400 }
      );
    }

    // 1. 获取物理空间信息
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select(`
        id,
        code,
        name,
        meter_id,
        created_at,
        meters (
          id,
          code,
          name,
          base_id,
          created_at,
          bases (
            id,
            name
          )
        )
      `)
      .eq('id', space_id)
      .single();

    if (spaceError || !space) {
      console.error('获取物理空间失败:', spaceError);
      return NextResponse.json(
        { success: false, error: '物理空间不存在' },
        { status: 404 }
      );
    }

    const meter = space.meters as any;
    const baseId = meter?.base_id;
    const meterId = meter?.id;

    if (!baseId || !meterId) {
      return NextResponse.json(
        { success: false, error: '空间缺少基地或物业信息' },
        { status: 400 }
      );
    }

    // 2. 获取基地下所有物业，按创建时间排序，确定当前物业的序号
    const { data: baseMeters, error: metersError } = await supabase
      .from('meters')
      .select('id, created_at')
      .eq('base_id', baseId)
      .order('created_at', { ascending: true });

    if (metersError || !baseMeters) {
      console.error('获取物业列表失败:', metersError);
      return NextResponse.json(
        { success: false, error: '获取物业列表失败' },
        { status: 500 }
      );
    }

    const meterIndex = baseMeters.findIndex(m => m.id === meterId);
    if (meterIndex === -1) {
      return NextResponse.json(
        { success: false, error: '无法确定物业序号' },
        { status: 500 }
      );
    }

    // 3. 获取物业下所有空间，按创建时间排序，确定当前空间的序号
    const { data: meterSpaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, created_at')
      .eq('meter_id', meterId)
      .order('created_at', { ascending: true });

    if (spacesError || !meterSpaces) {
      console.error('获取空间列表失败:', spacesError);
      return NextResponse.json(
        { success: false, error: '获取空间列表失败' },
        { status: 500 }
      );
    }

    const spaceIndex = meterSpaces.findIndex(s => s.id === space_id);
    if (spaceIndex === -1) {
      return NextResponse.json(
        { success: false, error: '无法确定空间序号' },
        { status: 500 }
      );
    }

    // 4. 获取该空间下已有的工位号后缀（随机部分），用于去重
    const { data: existingRegs, error: regsError } = await supabase
      .from('registration_numbers')
      .select('code')
      .eq('space_id', space_id);

    if (regsError) {
      console.error('获取已有工位号失败:', regsError);
      return NextResponse.json(
        { success: false, error: '获取已有工位号失败' },
        { status: 500 }
      );
    }

    // 提取已有的随机后缀（最后2位）
    const existingSuffixes = new Set(
      (existingRegs || [])
        .filter(r => r.code && r.code.length >= 2)
        .map(r => r.code.slice(-2).toUpperCase())
    );

    // 5. 生成新的工位号编码
    const year = new Date().getFullYear().toString().slice(-2); // 年份后2位
    const meterCode = toBase36(meterIndex); // 物业序号转36进制
    const spaceCode = toBase36(spaceIndex); // 空间序号转36进制

    // 生成随机后缀，确保不重复（最多尝试100次）
    let randomCode = randomBase36();
    let attempts = 0;
    while (existingSuffixes.has(randomCode) && attempts < 100) {
      randomCode = randomBase36();
      attempts++;
    }

    if (existingSuffixes.has(randomCode)) {
      return NextResponse.json(
        { success: false, error: '该空间的工位号已用尽' },
        { status: 400 }
      );
    }

    const newCode = `${year}${meterCode}${spaceCode}${randomCode}`;

    console.log('[生成工位号] 编码组成:', {
      year,
      meterIndex,
      meterCode,
      spaceIndex,
      spaceCode,
      randomCode,
      newCode
    });

    // 6. 插入新工位号
    const insertData = {
      id: crypto.randomUUID(),
      code: newCode,
      space_id: space_id,
      enterprise_id: enterprise_id || null,
      assigned_enterprise_name: assigned_enterprise_name || null,
      property_owner: '吉林省恒松物业管理有限公司',
      management_company: '吉林省天之企业管理咨询有限公司',
      available: !enterprise_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: newReg, error: insertError } = await supabase
      .from('registration_numbers')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('创建工位号失败:', insertError);
      return NextResponse.json(
        { success: false, error: '创建工位号失败' },
        { status: 500 }
      );
    }

    console.log('[生成工位号] 创建成功:', newReg);

    return NextResponse.json({
      success: true,
      data: {
        id: newReg.id,
        code: newReg.code,
        space_id: newReg.space_id,
        enterprise_id: newReg.enterprise_id,
        available: newReg.available,
        spaceInfo: {
          baseName: meter?.bases?.name,
          meterName: meter?.name,
          spaceName: space.name,
        },
      },
      message: '工位号生成成功',
    });
  } catch (error) {
    console.error('生成工位号失败:', error);
    return NextResponse.json(
      { success: false, error: '生成工位号失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/registration-numbers/generate
 * 获取指定空间的工位号列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('space_id');

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: '请提供空间ID' },
        { status: 400 }
      );
    }

    const { data: regNumbers, error } = await supabase
      .from('registration_numbers')
      .select('*')
      .eq('space_id', spaceId);

    if (error) {
      console.error('查询工位号失败:', error);
      return NextResponse.json(
        { success: false, error: '查询工位号失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: regNumbers || [],
    });
  } catch (error) {
    console.error('查询工位号失败:', error);
    return NextResponse.json(
      { success: false, error: '查询工位号失败' },
      { status: 500 }
    );
  }
}
