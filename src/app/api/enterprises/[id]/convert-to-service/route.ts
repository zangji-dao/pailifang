import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/enterprises/[id]/convert-to-service
 * 将入驻企业转为服务企业（迁出）
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 获取企业当前信息
    const { data: enterprise, error: queryError } = await supabase
      .from('enterprises')
      .select('id, name, type, process_status, registration_number')
      .eq('id', id)
      .single();

    if (queryError || !enterprise) {
      return NextResponse.json(
        { success: false, error: '企业不存在' },
        { status: 404 }
      );
    }

    // 检查是否是入驻企业
    if (enterprise.type !== 'tenant') {
      return NextResponse.json(
        { success: false, error: '只有入驻企业才能迁出' },
        { status: 400 }
      );
    }

    // 检查是否是入驻中状态
    if (enterprise.process_status !== 'active') {
      return NextResponse.json(
        { success: false, error: '只有入驻中的企业才能迁出' },
        { status: 400 }
      );
    }

    // 释放工位号
    if (enterprise.registration_number) {
      await supabase
        .from('registration_numbers')
        .update({ enterprise_id: null })
        .eq('enterprise_id', id);
    }

    // 更新企业类型和状态
    const { data, error } = await supabase
      .from('enterprises')
      .update({
        type: 'non_tenant',
        process_status: 'established',
        registration_number: null,
        space_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('迁出企业失败:', error);
      return NextResponse.json(
        { success: false, error: '迁出企业失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `企业「${enterprise.name}」已迁出，转为服务企业`,
      data,
    });
  } catch (error) {
    console.error('迁出企业失败:', error);
    return NextResponse.json(
      { success: false, error: '迁出企业失败' },
      { status: 500 }
    );
  }
}
