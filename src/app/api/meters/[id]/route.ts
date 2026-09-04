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
        id,
        base_id,
        code,
        name,
        area,
        status,
        sort_order,
        property_owner,
        management_company,
        electricity_enabled,
        electricity_number,
        electricity_provider,
        electricity_type,
        electricity_enterprise_id,
        water_enabled,
        water_number,
        water_provider,
        water_type,
        water_enterprise_id,
        heating_enabled,
        heating_number,
        heating_type,
        heating_status,
        heating_enterprise_id,
        property_fee_enabled,
        property_fee_type,
        property_fee_enterprise_id,
        network_enabled,
        network_number,
        network_type,
        network_status,
        network_enterprise_id,
        enterprise_id,
        created_at,
        updated_at,
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
      electricityType,
      electricityEnterpriseId,
      // 水表
      waterEnabled,
      waterNumber,
      waterProvider,
      waterType,
      waterEnterpriseId,
      // 取暖
      heatingEnabled,
      heatingNumber,
      heatingType,
      heatingStatus,
      heatingEnterpriseId,
      propertyFeeEnabled,
      propertyFeeType,
      propertyFeeEnterpriseId,
      // 网络
      networkEnabled,
      networkNumber,
      networkType,
      networkStatus,
      networkEnterpriseId,
      feeConfigs,
    } = body;

    const { data: existingMeter, error: existingMeterError } = await supabase
      .from('meters')
      .select('id,base_id')
      .eq('id', id)
      .single();

    if (existingMeterError || !existingMeter) {
      return NextResponse.json({ success: false, error: '物业不存在' }, { status: 404 });
    }

    const submittedFeeConfigs = Array.isArray(feeConfigs)
      ? feeConfigs.map(config => ({
          feeTypeId: String(config.feeTypeId || '').trim(),
          enabled: Boolean(config.enabled),
          responsibilityType: String(config.responsibilityType || 'base'),
          enterpriseId: String(config.enterpriseId || '').trim() || null,
          accountNumber: String(config.accountNumber || '').trim() || null,
          provider: String(config.provider || '').trim() || null,
          notes: String(config.notes || '').trim() || null,
        }))
      : [];
    const { data: submittedFeeTypes, error: submittedFeeTypesError } = submittedFeeConfigs.length > 0
      ? await supabase
          .from('base_fee_types')
          .select('id, name')
          .eq('base_id', existingMeter.base_id)
          .in('id', submittedFeeConfigs.map(config => config.feeTypeId))
      : { data: [], error: null };
    if (submittedFeeTypesError) {
      return NextResponse.json({ success: false, error: '校验基地费用类型失败' }, { status: 500 });
    }
    if (submittedFeeConfigs.length > 0 && submittedFeeTypes?.length !== new Set(submittedFeeConfigs.map(config => config.feeTypeId)).size) {
      return NextResponse.json({ success: false, error: '存在不属于当前基地的费用类型' }, { status: 400 });
    }
    const feeTypeNameById = new Map((submittedFeeTypes || []).map(feeType => [feeType.id, feeType.name]));
    const responsibilityConfigs = submittedFeeConfigs.length > 0
      ? submittedFeeConfigs.map(config => ({
          label: feeTypeNameById.get(config.feeTypeId) || '费用',
          enabled: config.enabled,
          type: config.responsibilityType,
          enterpriseId: config.enterpriseId,
        })).filter(config => config.enabled)
      : [
          { label: '电费', enabled: electricityEnabled, type: electricityType, enterpriseId: electricityEnterpriseId },
          { label: '水费', enabled: waterEnabled, type: waterType, enterpriseId: waterEnterpriseId },
          { label: '取暖费', enabled: heatingEnabled, type: heatingType, enterpriseId: heatingEnterpriseId },
          { label: '物业费', enabled: propertyFeeEnabled, type: propertyFeeType, enterpriseId: propertyFeeEnterpriseId },
          { label: '宽带费', enabled: networkEnabled, type: networkType, enterpriseId: networkEnterpriseId },
        ].filter(config => config.enabled !== false && config.type !== undefined);

    const invalidResponsibility = responsibilityConfigs.find(config => !['base', 'customer'].includes(String(config.type)));
    if (invalidResponsibility) {
      return NextResponse.json({ success: false, error: `${invalidResponsibility.label}承担方式不正确` }, { status: 400 });
    }
    const missingEnterprise = responsibilityConfigs.find(config => config.type === 'customer' && !String(config.enterpriseId || '').trim());
    if (missingEnterprise) {
      return NextResponse.json({ success: false, error: `请选择承担${missingEnterprise.label}的入驻企业` }, { status: 400 });
    }

    const responsibleEnterpriseIds = Array.from(new Set(
      responsibilityConfigs
        .filter(config => config.type === 'customer')
        .map(config => String(config.enterpriseId).trim())
    ));
    if (responsibleEnterpriseIds.length > 0) {
      const { data: tenantRelations, error: tenantRelationError } = await supabase
        .from('enterprise_base_relations')
        .select('enterprise_id')
        .eq('base_id', existingMeter.base_id)
        .eq('relation_type', 'tenant')
        .eq('status', 'active')
        .in('enterprise_id', responsibleEnterpriseIds);

      if (tenantRelationError) {
        return NextResponse.json({ success: false, error: '校验基地入驻企业失败' }, { status: 500 });
      }
      const validEnterpriseIds = new Set((tenantRelations || []).map(relation => relation.enterprise_id));
      if (responsibleEnterpriseIds.some(enterpriseId => !validEnterpriseIds.has(enterpriseId))) {
        return NextResponse.json({ success: false, error: '费用责任企业必须是当前基地的入驻企业' }, { status: 400 });
      }
    }

    // 构建更新对象
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    
    // 电表
    if (electricityEnabled !== undefined) {
      updateData.electricity_enabled = Boolean(electricityEnabled);
      if (!electricityEnabled) {
        updateData.electricity_type = 'base';
        updateData.electricity_enterprise_id = null;
      }
    }
    if (electricityNumber !== undefined) updateData.electricity_number = electricityNumber;
    if (electricityProvider !== undefined) updateData.electricity_provider = electricityProvider || null;
    if (electricityType !== undefined) {
      updateData.electricity_type = electricityType;
      if (electricityType === 'base') updateData.electricity_enterprise_id = null;
    }
    if (electricityEnterpriseId !== undefined && electricityType !== 'base') updateData.electricity_enterprise_id = electricityEnterpriseId || null;
    
    // 水表
    if (waterEnabled !== undefined) {
      updateData.water_enabled = Boolean(waterEnabled);
      if (!waterEnabled) {
        updateData.water_type = 'base';
        updateData.water_enterprise_id = null;
      }
    }
    if (waterNumber !== undefined) updateData.water_number = waterNumber;
    if (waterProvider !== undefined) updateData.water_provider = waterProvider || null;
    if (waterType !== undefined) {
      updateData.water_type = waterType;
      if (waterType === 'base') updateData.water_enterprise_id = null;
    }
    if (waterEnterpriseId !== undefined && waterType !== 'base') updateData.water_enterprise_id = waterEnterpriseId || null;
    
    // 取暖
    if (heatingEnabled !== undefined) {
      updateData.heating_enabled = Boolean(heatingEnabled);
      if (!heatingEnabled) {
        updateData.heating_type = 'base';
        updateData.heating_enterprise_id = null;
      }
    }
    if (heatingNumber !== undefined) updateData.heating_number = heatingNumber;
    if (heatingType !== undefined) {
      updateData.heating_type = heatingType;
      if (heatingType === 'base') updateData.heating_enterprise_id = null;
    }
    if (heatingStatus !== undefined) updateData.heating_status = heatingStatus;
    if (heatingEnterpriseId !== undefined && heatingType !== 'base') updateData.heating_enterprise_id = heatingEnterpriseId || null;
    if (propertyFeeEnabled !== undefined) {
      updateData.property_fee_enabled = Boolean(propertyFeeEnabled);
      if (!propertyFeeEnabled) {
        updateData.property_fee_type = 'base';
        updateData.property_fee_enterprise_id = null;
      }
    }
    if (propertyFeeType !== undefined) {
      updateData.property_fee_type = propertyFeeType;
      if (propertyFeeType === 'base') updateData.property_fee_enterprise_id = null;
    }
    if (propertyFeeEnterpriseId !== undefined && propertyFeeType !== 'base') updateData.property_fee_enterprise_id = propertyFeeEnterpriseId || null;
    
    // 网络
    if (networkEnabled !== undefined) {
      updateData.network_enabled = Boolean(networkEnabled);
      if (!networkEnabled) {
        updateData.network_type = 'base';
        updateData.network_enterprise_id = null;
      }
    }
    if (networkNumber !== undefined) updateData.network_number = networkNumber;
    if (networkType !== undefined) {
      updateData.network_type = networkType;
      if (networkType === 'base') updateData.network_enterprise_id = null;
    }
    if (networkStatus !== undefined) updateData.network_status = networkStatus;
    if (networkEnterpriseId !== undefined && networkType !== 'base') updateData.network_enterprise_id = networkEnterpriseId || null;

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

    if (submittedFeeConfigs.length > 0) {
      const now = new Date().toISOString();
      const { error: feeConfigError } = await supabase
        .from('meter_fee_configs')
        .upsert(submittedFeeConfigs.map(config => ({
          meter_id: id,
          fee_type_id: config.feeTypeId,
          enabled: config.enabled,
          responsibility_type: config.enabled ? config.responsibilityType : 'base',
          enterprise_id: config.enabled && config.responsibilityType === 'customer' ? config.enterpriseId : null,
          account_number: config.accountNumber,
          provider: config.provider,
          notes: config.notes,
          updated_at: now,
        })), { onConflict: 'meter_id,fee_type_id', ignoreDuplicates: false });
      if (feeConfigError) {
        console.error('保存物业费用配置失败:', feeConfigError);
        return NextResponse.json({ success: false, error: '物业信息已更新，但费用配置保存失败' }, { status: 500 });
      }
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
