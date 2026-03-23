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
      heatingStatus,
      heatingEnterpriseId,
      // 网络
      networkNumber,
      networkType,
      networkStatus,
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
    if (heatingStatus !== undefined) updateData.heating_status = heatingStatus;
    if (heatingEnterpriseId !== undefined) updateData.heating_enterprise_id = heatingEnterpriseId || null;
    
    // 网络
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
          reg_numbers (
            id,
            status
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

    // 检查是否有已分配的工位号
    const hasAllocatedRegNumbers = meter.spaces?.some((space: any) => 
      space.reg_numbers?.some((reg: any) => reg.status === 'allocated')
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
