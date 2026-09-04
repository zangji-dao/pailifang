import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/meters
 * 创建新物业
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      base_id,
      code,
      name,
      area,
      electricityEnabled = false,
      electricityNumber,
      electricityProvider,
      electricityType = 'base',
      electricityEnterpriseId,
      waterEnabled = false,
      waterNumber,
      waterProvider,
      waterType = 'base',
      waterEnterpriseId,
      heatingEnabled = false,
      heatingNumber,
      heatingType = 'base',
      heatingEnterpriseId,
      propertyFeeEnabled = false,
      propertyFeeType = 'base',
      propertyFeeEnterpriseId,
      networkEnabled = false,
      networkNumber,
      networkType = 'base',
      networkEnterpriseId,
      feeConfigs,
    } = body;

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

    const hasConfiguredFee = Array.isArray(feeConfigs) && feeConfigs.some(config => Boolean(config?.enabled));
    if (![electricityEnabled, waterEnabled, heatingEnabled, propertyFeeEnabled, networkEnabled].some(Boolean) && !hasConfiguredFee) {
      return NextResponse.json(
        { success: false, error: '请至少选择一项物业费用' },
        { status: 400 }
      );
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
    const { data: baseFeeTypes, error: baseFeeTypesError } = await supabase
      .from('base_fee_types')
      .select('id, code, name, is_active')
      .eq('base_id', base_id);
    if (baseFeeTypesError) {
      return NextResponse.json({ success: false, error: '校验基地费用类型失败' }, { status: 500 });
    }
    const baseFeeTypeById = new Map((baseFeeTypes || []).map(feeType => [feeType.id, feeType]));
    if (submittedFeeConfigs.some(config => !baseFeeTypeById.has(config.feeTypeId))) {
      return NextResponse.json({ success: false, error: '存在不属于当前基地的费用类型' }, { status: 400 });
    }
    const responsibilityConfigs = submittedFeeConfigs.length > 0
      ? submittedFeeConfigs.map(config => ({
          label: baseFeeTypeById.get(config.feeTypeId)?.name || '费用',
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
        ].filter(config => Boolean(config.enabled));

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
        .eq('base_id', base_id)
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
        electricity_enabled: Boolean(electricityEnabled),
        electricity_number: electricityEnabled ? electricityNumber || null : null,
        electricity_provider: electricityEnabled ? electricityProvider || null : null,
        electricity_type: electricityEnabled ? electricityType : 'base',
        electricity_enterprise_id: electricityEnabled && electricityType === 'customer' ? electricityEnterpriseId : null,
        water_enabled: Boolean(waterEnabled),
        water_number: waterEnabled ? waterNumber || null : null,
        water_provider: waterEnabled ? waterProvider || null : null,
        water_type: waterEnabled ? waterType : 'base',
        water_enterprise_id: waterEnabled && waterType === 'customer' ? waterEnterpriseId : null,
        heating_enabled: Boolean(heatingEnabled),
        heating_number: heatingEnabled ? heatingNumber || null : null,
        heating_type: heatingEnabled ? heatingType : 'base',
        heating_enterprise_id: heatingEnabled && heatingType === 'customer' ? heatingEnterpriseId : null,
        property_fee_enabled: Boolean(propertyFeeEnabled),
        property_fee_type: propertyFeeEnabled ? propertyFeeType : 'base',
        property_fee_enterprise_id: propertyFeeEnabled && propertyFeeType === 'customer' ? propertyFeeEnterpriseId : null,
        network_enabled: Boolean(networkEnabled),
        network_number: networkEnabled ? networkNumber || null : null,
        network_type: networkEnabled ? networkType : 'base',
        network_enterprise_id: networkEnabled && networkType === 'customer' ? networkEnterpriseId : null,
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

    const submittedConfigByTypeId = new Map(submittedFeeConfigs.map(config => [config.feeTypeId, config]));
    const legacyConfigByCode: Record<string, {
      enabled: boolean;
      responsibilityType: string;
      enterpriseId: string | null;
      accountNumber: string | null;
      provider: string | null;
    }> = {
      electricity: { enabled: Boolean(electricityEnabled), responsibilityType: electricityType, enterpriseId: electricityEnterpriseId || null, accountNumber: electricityNumber || null, provider: electricityProvider || null },
      water: { enabled: Boolean(waterEnabled), responsibilityType: waterType, enterpriseId: waterEnterpriseId || null, accountNumber: waterNumber || null, provider: waterProvider || null },
      heating: { enabled: Boolean(heatingEnabled), responsibilityType: heatingType, enterpriseId: heatingEnterpriseId || null, accountNumber: heatingNumber || null, provider: null },
      property_fee: { enabled: Boolean(propertyFeeEnabled), responsibilityType: propertyFeeType, enterpriseId: propertyFeeEnterpriseId || null, accountNumber: null, provider: null },
      network: { enabled: Boolean(networkEnabled), responsibilityType: networkType, enterpriseId: networkEnterpriseId || null, accountNumber: networkNumber || null, provider: null },
    };
    const now = new Date().toISOString();
    const feeConfigRows = (baseFeeTypes || []).map(feeType => {
      const submitted = submittedConfigByTypeId.get(feeType.id);
      const legacy = legacyConfigByCode[feeType.code];
      const config = submitted || legacy || {
        enabled: false,
        responsibilityType: 'base',
        enterpriseId: null,
        accountNumber: null,
        provider: null,
        notes: null,
      };
      return {
        meter_id: data.id,
        fee_type_id: feeType.id,
        enabled: config.enabled,
        responsibility_type: config.enabled ? config.responsibilityType : 'base',
        enterprise_id: config.enabled && config.responsibilityType === 'customer' ? config.enterpriseId : null,
        account_number: config.accountNumber,
        provider: config.provider,
        notes: 'notes' in config ? config.notes : null,
        created_at: now,
        updated_at: now,
      };
    });
    if (feeConfigRows.length > 0) {
      const { error: feeConfigError } = await supabase.from('meter_fee_configs').insert(feeConfigRows);
      if (feeConfigError) {
        console.error('初始化物业费用配置失败:', feeConfigError);
        await supabase.from('meters').delete().eq('id', data.id);
        return NextResponse.json({ success: false, error: '初始化物业费用配置失败' }, { status: 500 });
      }
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
