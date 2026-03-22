import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/spaces
 * 创建物理空间
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { meter_id, code, name, area, status } = body;

    if (!meter_id || !code) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：meter_id 和 code' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        id: crypto.randomUUID(),
        meter_id,
        code,
        name: name || code,
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
