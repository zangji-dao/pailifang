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
      // 电表
      electricityNumber,
      electricityType,
      electricityEnterpriseId,
      // 水表
      waterNumber,
      waterType,
      waterEnterpriseId,
      // 取暖
      heatingNumber,
      heatingType,
      heatingArrears,
      heatingEnterpriseId,
      // 网络
      networkNumber,
      networkType,
      networkArrears,
    } = body;

    // 构建更新对象
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    
    // 电表
    if (electricityNumber !== undefined) updateData.electricity_number = electricityNumber;
    if (electricityType !== undefined) updateData.electricity_type = electricityType;
    if (electricityEnterpriseId !== undefined) updateData.electricity_enterprise_id = electricityEnterpriseId || null;
    
    // 水表
    if (waterNumber !== undefined) updateData.water_number = waterNumber;
    if (waterType !== undefined) updateData.water_type = waterType;
    if (waterEnterpriseId !== undefined) updateData.water_enterprise_id = waterEnterpriseId || null;
    
    // 取暖
    if (heatingNumber !== undefined) updateData.heating_number = heatingNumber;
    if (heatingType !== undefined) updateData.heating_type = heatingType;
    if (heatingArrears !== undefined) updateData.heating_arrears = heatingArrears;
    if (heatingEnterpriseId !== undefined) updateData.heating_enterprise_id = heatingEnterpriseId || null;
    
    // 网络
    if (networkNumber !== undefined) updateData.network_number = networkNumber;
    if (networkType !== undefined) updateData.network_type = networkType;
    if (networkArrears !== undefined) updateData.network_arrears = networkArrears;

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
 * 部分更新物业信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 支持部分更新
    if (body.electricity_balance !== undefined) {
      updateData.electricity_balance = body.electricity_balance;
      updateData.electricity_balance_updated_at = new Date().toISOString();
    }
    if (body.water_balance !== undefined) {
      updateData.water_balance = body.water_balance;
      updateData.water_balance_updated_at = new Date().toISOString();
    }
    if (body.heating_arrears !== undefined) {
      updateData.heating_arrears = body.heating_arrears;
    }
    if (body.network_arrears !== undefined) {
      updateData.network_arrears = body.network_arrears;
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
