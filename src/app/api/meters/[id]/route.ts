import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/meters/[id]
 * 更新物业信息（如各表号的负责公司）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const { 
      enterprise_id,
      electricity_enterprise_id, 
      water_enterprise_id, 
      heating_enterprise_id 
    } = body;

    // 构建更新对象
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (enterprise_id !== undefined) {
      updateData.enterprise_id = enterprise_id || null;
    }
    if (electricity_enterprise_id !== undefined) {
      updateData.electricity_enterprise_id = electricity_enterprise_id || null;
    }
    if (water_enterprise_id !== undefined) {
      updateData.water_enterprise_id = water_enterprise_id || null;
    }
    if (heating_enterprise_id !== undefined) {
      updateData.heating_enterprise_id = heating_enterprise_id || null;
    }

    const { data, error } = await supabase
      .from('meters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新物业失败:', error);
      return NextResponse.json(
        { success: false, error: '更新物业失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('更新物业失败:', error);
    return NextResponse.json(
      { success: false, error: '更新物业失败' },
      { status: 500 }
    );
  }
}
