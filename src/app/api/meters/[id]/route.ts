import { createClient } from '@/lib/database/server';
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
          registration_numbers (
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
      electricityEnabled,
      electricityNumber,
      electricityProvider,
      electricityChargeInst,
      electricityType,
      electricityEnterpriseId,
      // 水表
      waterEnabled,
      waterNumber,
      waterProvider,
      waterChargeInst,
      waterType,
      waterEnterpriseId,
      // 取暖
      heatingEnabled,
      heatingNumber,
      heatingType,
      heatingStatus,
      heatingEnterpriseId,
      propertyFeeEnabled,
      // 网络
      networkEnabled,
      networkNumber,
      networkType,
      networkStatus,
    } = body;

    // 构建更新对象
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    
    // 电表
    if (electricityEnabled !== undefined) updateData.electricity_enabled = Boolean(electricityEnabled);
    if (electricityNumber !== undefined) updateData.electricity_number = electricityNumber;
    if (electricityProvider !== undefined) updateData.electricity_provider = electricityProvider || null;
    if (electricityChargeInst !== undefined) updateData.electricity_charge_inst = electricityChargeInst || null;
    if (electricityType !== undefined) updateData.electricity_type = electricityType;
    if (electricityEnterpriseId !== undefined) updateData.electricity_enterprise_id = electricityEnterpriseId || null;
    
    // 水表
    if (waterEnabled !== undefined) updateData.water_enabled = Boolean(waterEnabled);
    if (waterNumber !== undefined) updateData.water_number = waterNumber;
    if (waterProvider !== undefined) updateData.water_provider = waterProvider || null;
    if (waterChargeInst !== undefined) updateData.water_charge_inst = waterChargeInst || null;
    if (waterType !== undefined) updateData.water_type = waterType;
    if (waterEnterpriseId !== undefined) updateData.water_enterprise_id = waterEnterpriseId || null;
    
    // 取暖
    if (heatingEnabled !== undefined) updateData.heating_enabled = Boolean(heatingEnabled);
    if (heatingNumber !== undefined) updateData.heating_number = heatingNumber;
    if (heatingType !== undefined) updateData.heating_type = heatingType;
    if (heatingStatus !== undefined) updateData.heating_status = heatingStatus;
    if (heatingEnterpriseId !== undefined) updateData.heating_enterprise_id = heatingEnterpriseId || null;
    if (propertyFeeEnabled !== undefined) updateData.property_fee_enabled = Boolean(propertyFeeEnabled);
    
    // 网络
    if (networkEnabled !== undefined) updateData.network_enabled = Boolean(networkEnabled);
    if (networkNumber !== undefined) updateData.network_number = networkNumber;
    if (networkType !== undefined) updateData.network_type = networkType;
    if (networkStatus !== undefined) updateData.network_status = networkStatus;

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

    const updateData: Record<string, unknown> = {
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
    if (body.heating_status !== undefined) {
      updateData.heating_status = body.heating_status;
    }
    if (body.network_status !== undefined) {
      updateData.network_status = body.network_status;
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

/**
 * DELETE /api/meters/[id]
 * 删除物业（需要检查是否有入驻企业和已分配的工位号）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 先获取物业信息，检查是否可以删除
    const { data: meter, error: fetchError } = await supabase
      .from('meters')
      .select(`
        id,
        enterprise_id,
        spaces (
          id,
          registration_numbers (
            id,
            available
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !meter) {
      return NextResponse.json(
        { success: false, error: '物业不存在' },
        { status: 404 }
      );
    }

    // 检查是否有入驻企业
    if (meter.enterprise_id) {
      return NextResponse.json(
        { success: false, error: '该物业已入驻企业，无法删除' },
        { status: 400 }
      );
    }

    // 检查是否有已分配的工位号（available = false 表示已分配）
    const hasAllocatedRegNumbers = meter.spaces?.some((space: { registration_numbers?: Array<{ available?: boolean }> }) =>
      space.registration_numbers?.some(reg => reg.available === false)
    );

    if (hasAllocatedRegNumbers) {
      return NextResponse.json(
        { success: false, error: '该物业有已分配的工位号，无法删除' },
        { status: 400 }
      );
    }

    // 可以删除，先删除关联的空间和工位号
    // 由于数据库有级联删除，直接删除物业即可
    const { error: deleteError } = await supabase
      .from('meters')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('删除物业失败:', deleteError);
      return NextResponse.json(
        { success: false, error: '删除物业失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '物业删除成功',
    });
  } catch (error) {
    console.error('删除物业失败:', error);
    return NextResponse.json(
      { success: false, error: '删除物业失败' },
      { status: 500 }
    );
  }
}
