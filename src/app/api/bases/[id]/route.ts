import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

type BaseSpaceRow = Record<string, unknown> & {
  id: string;
  code?: string;
  name?: string;
};

// 将 snake_case 转换为 camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value instanceof Date) {
      result[camelKey] = value.toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        item && typeof item === 'object' ? toCamelCase(item as Record<string, unknown>) : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * GET /api/bases/[id]
 * 获取单个基地详情（包含管理公司信息）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 获取基地基本信息
    const { data: base, error: baseError } = await supabase
      .from('bases')
      .select(`
        id,
        name,
        address,
        address_template,
        status,
        created_at,
        updated_at,
        organization_id,
        management_company_name,
        management_company_credit_code,
        management_company_legal_person,
        management_company_address,
        management_company_phone,
        property_fee_mode,
        property_fee_billing_cycle
      `)
      .eq('id', id)
      .single();

    if (baseError) {
      console.error('获取基地失败:', baseError);
      return NextResponse.json({ success: false, error: '获取基地失败' }, { status: 500 });
    }

    if (!base) {
      return NextResponse.json({ success: false, error: '基地不存在' }, { status: 404 });
    }

    const { data: operatorOrganization, error: organizationError } = base.organization_id
      ? await supabase
          .from('organizations')
          .select('id, name, type, status, metadata')
          .eq('id', base.organization_id)
          .single()
      : { data: null, error: null };

    if (organizationError) {
      console.error('获取基地运营机构失败:', organizationError);
    }

    // 获取关联的物业
    const { data: meters, error: metersError } = await supabase
      .from('meters')
      .select(`
        id,
        code,
        name,
        area,
        status,
        base_id,
        sort_order,
        electricity_enabled,
        electricity_number,
        electricity_provider,
        electricity_charge_inst,
        electricity_type,
        electricity_balance,
        electricity_balance_updated_at,
        electricity_enterprise_id,
        water_enabled,
        water_number,
        water_provider,
        water_charge_inst,
        water_type,
        water_balance,
        water_balance_updated_at,
        water_enterprise_id,
        heating_enabled,
        heating_number,
        heating_type,
        heating_status,
        heating_enterprise_id,
        property_fee_enabled,
        network_enabled,
        network_number,
        network_type,
        network_status,
        enterprise_id,
        created_at,
        updated_at,
        spaces (
          id,
          code,
          name,
          area,
          status,
          meter_id,
          enterprise_id,
          created_at,
          updated_at
        )
      `)
      .eq('base_id', id)
      .order('sort_order');

    if (metersError) {
      console.error('获取物业失败:', metersError);
    }

    const meterIds = (meters || []).map(meter => meter.id);
    const { data: utilityPayments, error: utilityPaymentError } = meterIds.length > 0
      ? await supabase
          .from('property_utility_payments')
          .select(`
            id,
            meter_id,
            utility_type,
            billing_period,
            provider,
            account_number,
            charge_type,
            quantity,
            quantity_unit,
            unit_price,
            amount,
            status,
            paid_at,
            payment_method,
            receipt_number,
            metadata,
            created_at,
            updated_at
          `)
          .in('meter_id', meterIds)
          .order('paid_at', { ascending: false })
      : { data: [], error: null };

    if (utilityPaymentError) {
      console.error('获取物业缴费记录失败:', utilityPaymentError);
    }

    const paymentsByMeterId: Record<string, Record<string, unknown>[]> = {};
    (utilityPayments || []).forEach(payment => {
      if (!paymentsByMeterId[payment.meter_id]) {
        paymentsByMeterId[payment.meter_id] = [];
      }
      paymentsByMeterId[payment.meter_id].push(toCamelCase(payment));
    });

    // 获取所有空间的 ID
    const spaceIds = meters?.flatMap(m => m.spaces?.map((space: BaseSpaceRow) => space.id) || []) || [];
    
    // 单独查询工位号（registration_numbers）- 不包含 enterprise 关联
    const { data: regNumbers, error: regError } = spaceIds.length > 0
      ? await supabase
          .from('registration_numbers')
          .select(`
            id,
            code,
            manual_code,
            space_id,
            enterprise_id,
            available,
            property_owner,
            management_company,
            assigned_enterprise_name,
            created_at,
            updated_at
          `)
          .in('space_id', spaceIds)
      : { data: [], error: null };

    if (regError) {
      console.error('获取工位号失败:', regError);
    }

    // 获取所有工位号关联的企业ID
    const enterpriseIds = regNumbers?.map(r => r.enterprise_id).filter(Boolean) || [];
    
    // 查询企业信息
    const { data: workstationEnterprises, error: entError } = enterpriseIds.length > 0
      ? await supabase
          .from('enterprises')
          .select('id, name')
          .in('id', enterpriseIds)
      : { data: [], error: null };
    
    if (entError) {
      console.error('获取企业信息失败:', entError);
    }
    
    // 创建企业ID到企业信息的映射
    const enterpriseMap: Record<string, { id: string; name: string }> = {};
    workstationEnterprises?.forEach(ent => {
      enterpriseMap[ent.id] = ent;
    });
    
    // 将企业信息添加到工位号
    const regNumbersWithEnterprise = regNumbers?.map(reg => ({
      ...reg,
      enterprise: reg.enterprise_id ? enterpriseMap[reg.enterprise_id] || null : null
    })) || [];

    // 组装数据：将工位号按 space_id 分组
    const regNumbersBySpaceId: Record<string, typeof regNumbersWithEnterprise> = {};
    regNumbersWithEnterprise?.forEach(reg => {
      if (!regNumbersBySpaceId[reg.space_id]) {
        regNumbersBySpaceId[reg.space_id] = [];
      }
      regNumbersBySpaceId[reg.space_id].push(reg);
    });

    // 将工位号添加到对应的空间
    const metersWithRegNumbers = meters?.map(meter => ({
      ...meter,
      spaces: meter.spaces?.map((space: BaseSpaceRow) => ({
        ...space,
        regNumbers: regNumbersBySpaceId[space.id] || []
      })) || [],
      utilityPayments: paymentsByMeterId[meter.id] || [],
    })) || [];

    // 转换字段名为 camelCase
    const camelBase = toCamelCase(base);
    const camelMeters = metersWithRegNumbers.map(m => toCamelCase(m));

    const { data: activeRelations, error: relationError } = await supabase
      .from('enterprise_base_relations')
      .select('id, enterprise_id, relation_type, status, source, started_at, ended_at')
      .eq('base_id', id)
      .eq('status', 'active');

    if (relationError) {
      console.error('获取基地企业关系失败:', relationError);
    }

    const relationEnterpriseIds = (activeRelations || [])
      .map(relation => relation.enterprise_id)
      .filter(Boolean);
    const allEnterpriseIds = Array.from(new Set([...enterpriseIds, ...relationEnterpriseIds]));
    const { data: enterpriseDetails, error: enterpriseDetailError } = allEnterpriseIds.length > 0
      ? await supabase
          .from('enterprises')
          .select(`
            id,
            name,
            enterprise_code,
            credit_code,
            legal_person,
            phone,
            admin_name,
            admin_phone,
            process_status,
            type,
            status,
            industry,
            registered_address,
            business_address,
            settled_date,
            created_at,
            updated_at
          `)
          .in('id', allEnterpriseIds)
      : { data: [], error: null };

    if (enterpriseDetailError) {
      console.error('获取基地企业明细失败:', enterpriseDetailError);
    }

    const enterpriseDetailMap: Record<string, Record<string, unknown>> = {};
    (enterpriseDetails || []).forEach(enterprise => {
      enterpriseDetailMap[enterprise.id] = enterprise;
    });

    const locationsByEnterprise: Record<string, string[]> = {};
    const workstationCountByEnterprise: Record<string, number> = {};
    (meters || []).forEach(meter => {
      (meter.spaces || []).forEach((space: { id: string; code?: string; name?: string }) => {
        (regNumbersBySpaceId[space.id] || []).forEach(workstation => {
          if (!workstation.enterprise_id) return;
          workstationCountByEnterprise[workstation.enterprise_id] =
            (workstationCountByEnterprise[workstation.enterprise_id] || 0) + 1;
          const location = `${meter.code} · ${space.name || space.code || '未命名空间'} · ${workstation.manual_code || workstation.code}`;
          if (!locationsByEnterprise[workstation.enterprise_id]) {
            locationsByEnterprise[workstation.enterprise_id] = [];
          }
          locationsByEnterprise[workstation.enterprise_id].push(location);
        });
      });
    });

    const relationKeys = new Set(
      (activeRelations || []).map(relation => `${relation.enterprise_id}:${relation.relation_type}`)
    );
    const normalizedRelations = [
      ...(activeRelations || []),
      ...enterpriseIds
        .filter(enterpriseId => !relationKeys.has(`${enterpriseId}:tenant`))
        .map(enterpriseId => ({
          id: `workstation-${enterpriseId}`,
          enterprise_id: enterpriseId,
          relation_type: 'tenant',
          status: 'active',
          source: 'workstation',
          started_at: null,
          ended_at: null,
        })),
    ];

    const enterpriseRelations = normalizedRelations.flatMap(relation => {
      const enterprise = enterpriseDetailMap[relation.enterprise_id];
      if (!enterprise) return [];
      return [{
        ...toCamelCase(relation),
        ...toCamelCase(enterprise),
        relationId: relation.id,
        relationType: relation.relation_type,
        relationStatus: relation.status,
        source: relation.source,
        startedAt: relation.started_at,
        endedAt: relation.ended_at,
        assignedWorkstationCount: workstationCountByEnterprise[relation.enterprise_id] || 0,
        locations: locationsByEnterprise[relation.enterprise_id] || [],
      }];
    });
    const tenantEnterprises = enterpriseRelations.filter(enterprise => enterprise.relationType === 'tenant');
    const serviceEnterprises = enterpriseRelations.filter(enterprise => enterprise.relationType === 'service');

    return NextResponse.json({
      success: true,
      data: {
        ...camelBase,
        organization: operatorOrganization ? toCamelCase(operatorOrganization) : null,
        tenantEnterprises,
        serviceEnterprises,
        serviceEnterpriseCount: serviceEnterprises.length,
        meters: camelMeters,
      },
    });
  } catch (error) {
    console.error('获取基地详情失败:', error);
    return NextResponse.json({ success: false, error: '获取基地详情失败' }, { status: 500 });
  }
}

/**
 * PUT /api/bases/[id]
 * 更新基地信息（包含管理公司信息）
 */
export async function PUT(
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

    // 基本信息字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.address_template !== undefined) updateData.address_template = body.address_template;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.property_fee_mode !== undefined) updateData.property_fee_mode = body.property_fee_mode;
    if (body.property_fee_billing_cycle !== undefined) updateData.property_fee_billing_cycle = body.property_fee_billing_cycle;

    if (body.organization_id !== undefined) {
      const organizationId = typeof body.organization_id === 'string' ? body.organization_id.trim() : '';
      if (!organizationId) {
        return NextResponse.json({ success: false, error: '请选择运营机构' }, { status: 400 });
      }
      const { data: operatorOrganization, error: organizationError } = await supabase
        .from('organizations')
        .select('id, type, status')
        .eq('id', organizationId)
        .single();
      if (organizationError || !operatorOrganization || operatorOrganization.type !== 'park') {
        return NextResponse.json({ success: false, error: '所选运营机构不存在或类型不正确' }, { status: 400 });
      }
      if (operatorOrganization.status !== 'active') {
        return NextResponse.json({ success: false, error: '所选运营机构已停用' }, { status: 400 });
      }
      updateData.organization_id = organizationId;
    }

    const { data, error } = await supabase
      .from('bases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新基地失败:', error);
      return NextResponse.json({ success: false, error: '更新基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新基地失败:', error);
    return NextResponse.json({ success: false, error: '更新基地失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/bases/[id]
 * 删除基地
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('bases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除基地失败:', error);
      return NextResponse.json({ success: false, error: '删除基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除基地失败:', error);
    return NextResponse.json({ success: false, error: '删除基地失败' }, { status: 500 });
  }
}
