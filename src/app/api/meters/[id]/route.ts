import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/meters/[id]
 * 获取单个物业详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('meters')
      .select(`
        *,
        spaces (
          *,
          reg_numbers (
            *,
            enterprise:enterprises (id, name)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '获取物业失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('获取物业失败:', error);
    return NextResponse.json(
      { success: false, error: '获取物业失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meters/[id]
 * 完整更新物业信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const {
      code,
      name,
      area,
      electricityNumber,
      electricityType,
      electricityEnterpriseId,
      waterNumber,
      waterType,
      waterEnterpriseId,
      heatingNumber,
      heatingType,
      heatingEnterpriseId,
    } = body;

    // 构建更新对象
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    if (electricityNumber !== undefined) updateData.electricity_number = electricityNumber;
    if (electricityType !== undefined) updateData.electricity_type = electricityType;
    if (electricityEnterpriseId !== undefined) updateData.electricity_enterprise_id = electricityEnterpriseId || null;
    if (waterNumber !== undefined) updateData.water_number = waterNumber;
    if (waterType !== undefined) updateData.water_type = waterType;
    if (waterEnterpriseId !== undefined) updateData.water_enterprise_id = waterEnterpriseId || null;
    if (heatingNumber !== undefined) updateData.heating_number = heatingNumber;
    if (heatingType !== undefined) updateData.heating_type = heatingType;
    if (heatingEnterpriseId !== undefined) updateData.heating_enterprise_id = heatingEnterpriseId || null;

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

/**
 * PATCH /api/meters/[id]
 * 部分更新物业信息（如各表号的负责公司）
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
