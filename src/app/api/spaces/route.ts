import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/spaces
 * 创建物理空间
 * 编号自动生成，格式：KJ + 6位数字（如 KJ000001）
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

    // 2. 生成新的空间编号：KJ + 6位数字
    const { data: maxSpace, error: maxError } = await supabase
      .from('spaces')
      .select('code')
      .like('code', 'KJ%')
      .order('code', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (maxSpace && maxSpace.length > 0) {
      const lastCode = maxSpace[0].code;
      const lastSequence = parseInt(lastCode.replace('KJ', ''), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // 生成8位编号：KJ + 6位数字
    const autoCode = `KJ${String(sequence).padStart(6, '0')}`;

    // 3. 创建空间
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
