import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/meters
 * 创建新物业
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { base_id, code, name, area } = body;

    if (!base_id) {
      return NextResponse.json(
        { success: false, error: '基地ID为必填项' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: '物业编号为必填项' },
        { status: 400 }
      );
    }

    // 检查编号是否已存在
    const { data: existing } = await supabase
      .from('meters')
      .select('id')
      .eq('base_id', base_id)
      .eq('code', code)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: '该物业编号已存在' },
        { status: 400 }
      );
    }

    // 创建物业
    const { data, error } = await supabase
      .from('meters')
      .insert({
        id: crypto.randomUUID(),
        base_id,
        code,
        name: name || code,
        area: area || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建物业失败:', error);
      return NextResponse.json(
        { success: false, error: '创建物业失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('创建物业失败:', error);
    return NextResponse.json(
      { success: false, error: '创建物业失败' },
      { status: 500 }
    );
  }
}
