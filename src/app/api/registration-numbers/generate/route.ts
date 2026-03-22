import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/registration-numbers/generate
 * 为指定的物理空间生成注册号（每个空间可生成多个）
 * 
 * 请求体：
 * - space_id: 物理空间ID（必填）
 * - enterprise_id: 企业ID（可选，分配时提供）
 * - assigned_enterprise_name: 预分配企业名称（必填）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { space_id, enterprise_id, assigned_enterprise_name } = body;

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

    // 2. 生成新的注册号
    // 规则：REG-年份-月份-序号（如 REG-2026-03-001）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // 获取当月最大序号
    const { data: maxReg, error: maxError } = await supabase
      .from('registration_numbers')
      .select('code')
      .like('code', `REG-${year}-${month}-%`)
      .order('code', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (maxReg && maxReg.length > 0) {
      const lastCode = maxReg[0].code;
      const lastSequence = parseInt(lastCode.split('-')[3], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    const newCode = `REG-${year}-${month}-${String(sequence).padStart(3, '0')}`;

    // 3. 插入新注册号（带默认产权单位和管理单位）
    const { data: newReg, error: insertError } = await supabase
      .from('registration_numbers')
      .insert({
        id: crypto.randomUUID(),
        code: newCode,
        space_id: space_id,
        enterprise_id: enterprise_id || null,
        assigned_enterprise_name: assigned_enterprise_name || null,
        property_owner: '吉林省恒松物业管理有限公司',
        management_company: '吉林省天之企业管理咨询有限公司',
        available: !enterprise_id, // 如果指定了企业，则标记为已分配
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建注册号失败:', insertError);
      return NextResponse.json(
        { success: false, error: '创建注册号失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newReg.id,
        code: newReg.code,
        space_id: newReg.space_id,
        enterprise_id: newReg.enterprise_id,
        available: newReg.available,
        spaceInfo: {
          baseName: (space.meters as any)?.bases?.name,
          meterName: (space.meters as any)?.name,
          spaceName: space.name,
        },
      },
      message: '注册号生成成功',
    });
  } catch (error) {
    console.error('生成注册号失败:', error);
    return NextResponse.json(
      { success: false, error: '生成注册号失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/registration-numbers/generate
 * 获取指定空间的注册号列表
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
      console.error('查询注册号失败:', error);
      return NextResponse.json(
        { success: false, error: '查询注册号失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: regNumbers || [],
    });
  } catch (error) {
    console.error('查询注册号失败:', error);
    return NextResponse.json(
      { success: false, error: '查询注册号失败' },
      { status: 500 }
    );
  }
}
