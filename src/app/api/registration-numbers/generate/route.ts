import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 生成4位随机数字字符串
 * @returns 4位随机数字（0000-9999）
 */
function randomDigits4(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/**
 * POST /api/registration-numbers/generate
 * 为指定的物理空间生成工位号
 * 
 * 编码规则：[PI][基地码2位][随机4位]
 * - PI：固定前缀
 * - 基地码：基地按创建顺序编号（01-99）
 * - 随机：4位随机数字，确保不重复
 * 
 * 示例：PI013847
 *       │  │  └── 随机数字（3847）
 *       │  └──── 基地码（01号基地）
 *       └─────── 固定前缀 PI
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
        meters (
          id,
          code,
          name,
          base_id,
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

    if (!baseId) {
      return NextResponse.json(
        { success: false, error: '空间缺少基地信息' },
        { status: 400 }
      );
    }

    // 2. 获取所有基地，按创建时间排序，确定当前基地的序号
    const { data: bases, error: basesError } = await supabase
      .from('bases')
      .select('id')
      .order('created_at', { ascending: true });

    if (basesError || !bases) {
      console.error('获取基地列表失败:', basesError);
      return NextResponse.json(
        { success: false, error: '获取基地列表失败' },
        { status: 500 }
      );
    }

    const baseIndex = bases.findIndex(b => b.id === baseId);
    if (baseIndex === -1) {
      return NextResponse.json(
        { success: false, error: '无法确定基地序号' },
        { status: 500 }
      );
    }

    // 基地码：序号+1，补齐2位
    const baseCode = String(baseIndex + 1).padStart(2, '0');

    // 3. 获取该基地下已有的工位号，提取随机部分用于去重
    // 先获取该基地下所有空间的ID
    const { data: baseMeters, error: metersError } = await supabase
      .from('meters')
      .select('id')
      .eq('base_id', baseId);

    if (metersError) {
      console.error('获取物业列表失败:', metersError);
      return NextResponse.json(
        { success: false, error: '获取物业列表失败' },
        { status: 500 }
      );
    }

    const meterIds = (baseMeters || []).map(m => m.id);

    // 获取这些物业下所有空间
    const { data: baseSpaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id')
      .in('meter_id', meterIds);

    if (spacesError) {
      console.error('获取空间列表失败:', spacesError);
      return NextResponse.json(
        { success: false, error: '获取空间列表失败' },
        { status: 500 }
      );
    }

    const spaceIds = (baseSpaces || []).map(s => s.id);

    // 获取该基地下所有工位号
    const { data: existingRegs, error: regsError } = await supabase
      .from('registration_numbers')
      .select('code')
      .in('space_id', spaceIds);

    // 提取已有的随机后缀（PI+基地码后的4位）
    const prefix = `PI${baseCode}`;
    const existingSuffixes = new Set(
      (existingRegs || [])
        .filter(r => r.code && r.code.startsWith(prefix))
        .map(r => r.code.slice(-4))
    );

    // 4. 生成随机后缀，确保不重复（最多尝试100次）
    let randomCode = randomDigits4();
    let attempts = 0;
    while (existingSuffixes.has(randomCode) && attempts < 100) {
      randomCode = randomDigits4();
      attempts++;
    }

    if (existingSuffixes.has(randomCode)) {
      return NextResponse.json(
        { success: false, error: '该基地的工位号随机池已用尽' },
        { status: 400 }
      );
    }

    const newCode = `${prefix}${randomCode}`;

    console.log('[生成工位号] 编码组成:', {
      prefix: 'PI',
      baseIndex: baseIndex + 1,
      baseCode,
      randomCode,
      newCode
    });

    // 5. 插入新工位号
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
