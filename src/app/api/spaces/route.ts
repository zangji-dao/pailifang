import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/spaces
 * 创建物理空间
 * 编号自动生成，格式：物业编号-序号（如 101-1）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { meter_id, name, area, status } = body;

    if (!meter_id) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：meter_id' },
        { status: 400 }
      );
    }

    // 1. 获取物业信息
    const { data: meter, error: meterError } = await supabase
      .from('meters')
      .select('id, code')
      .eq('id', meter_id)
      .single();

    if (meterError || !meter) {
      return NextResponse.json(
        { success: false, error: '物业不存在' },
        { status: 404 }
      );
    }

    // 2. 查询该物业下已有的空间数量
    const { data: existingSpaces, error: countError } = await supabase
      .from('spaces')
      .select('id')
      .eq('meter_id', meter_id);

    if (countError) {
      console.error('查询空间数量失败:', countError);
    }

    const nextIndex = (existingSpaces?.length || 0) + 1;

    // 3. 自动生成编号：物业编号-序号
    const autoCode = `${meter.code}-${nextIndex}`;

    // 4. 创建空间
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        id: crypto.randomUUID(),
        meter_id,
        code: autoCode,
        name: name || autoCode,
        area: area || null,
        status: status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建空间失败:', error);
      return NextResponse.json(
        { success: false, error: '创建空间失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('创建空间失败:', error);
    return NextResponse.json(
      { success: false, error: '创建空间失败' },
      { status: 500 }
    );
  }
}
