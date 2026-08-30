import { createClient } from '@/lib/database/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/bases
 * 获取所有基地列表（包含管理公司信息）
 */
export async function GET() {
  try {
    const supabase = createClient();

    const [baseResult, propertyResult, spaceResult, workstationResult, relationResult] = await Promise.all([
      supabase
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
          management_company_phone
        `)
        .order('created_at', { ascending: false }),
      supabase.from('meters').select('id, base_id'),
      supabase.from('spaces').select('id, meter_id'),
      supabase.from('registration_numbers').select('id, space_id, enterprise_id, available'),
      supabase
        .from('enterprise_base_relations')
        .select('enterprise_id, base_id, relation_type, status')
        .eq('status', 'active'),
    ]);

    const { data: bases, error } = baseResult;

    if (error) {
      console.error('获取基地列表失败:', error);
      return NextResponse.json({ success: false, error: '获取基地列表失败' }, { status: 500 });
    }

    if (propertyResult.error) console.error('获取物业统计失败:', propertyResult.error);
    if (spaceResult.error) console.error('获取物理空间统计失败:', spaceResult.error);
    if (workstationResult.error) console.error('获取工位统计失败:', workstationResult.error);
    if (relationResult.error) console.error('获取企业基地关系统计失败:', relationResult.error);

    const stats = new Map<string, {
      propertyCount: number;
      spaceCount: number;
      workstationCount: number;
      allocatedWorkstationCount: number;
      tenantEnterpriseIds: Set<string>;
      serviceEnterpriseIds: Set<string>;
    }>();
    const ensureStats = (baseId: string) => {
      if (!stats.has(baseId)) {
        stats.set(baseId, {
          propertyCount: 0,
          spaceCount: 0,
          workstationCount: 0,
          allocatedWorkstationCount: 0,
          tenantEnterpriseIds: new Set<string>(),
          serviceEnterpriseIds: new Set<string>(),
        });
      }
      return stats.get(baseId)!;
    };

    const propertyBaseMap = new Map<string, string>();
    (propertyResult.data || []).forEach((property: { id: string; base_id: string }) => {
      propertyBaseMap.set(property.id, property.base_id);
      ensureStats(property.base_id).propertyCount += 1;
    });

    const spaceBaseMap = new Map<string, string>();
    (spaceResult.data || []).forEach((space: { id: string; meter_id: string }) => {
      const baseId = propertyBaseMap.get(space.meter_id);
      if (!baseId) return;
      spaceBaseMap.set(space.id, baseId);
      ensureStats(baseId).spaceCount += 1;
    });

    (workstationResult.data || []).forEach((workstation: { space_id: string; enterprise_id: string | null; available: boolean }) => {
      const baseId = spaceBaseMap.get(workstation.space_id);
      if (!baseId) return;
      const baseStats = ensureStats(baseId);
      baseStats.workstationCount += 1;
      if (workstation.enterprise_id || workstation.available === false) {
        baseStats.allocatedWorkstationCount += 1;
      }
      if (workstation.enterprise_id) {
        baseStats.tenantEnterpriseIds.add(workstation.enterprise_id);
      }
    });

    (relationResult.data || []).forEach((relation: { enterprise_id: string; base_id: string; relation_type: string }) => {
      const baseStats = ensureStats(relation.base_id);
      if (relation.relation_type === 'service') {
        baseStats.serviceEnterpriseIds.add(relation.enterprise_id);
      }
    });

    const result = (bases || []).map(base => ({
      ...base,
      propertyCount: ensureStats(base.id).propertyCount,
      meterCount: ensureStats(base.id).propertyCount,
      spaceCount: ensureStats(base.id).spaceCount,
      workstationCount: ensureStats(base.id).workstationCount,
      allocatedWorkstationCount: ensureStats(base.id).allocatedWorkstationCount,
      tenantEnterpriseCount: ensureStats(base.id).tenantEnterpriseIds.size,
      serviceEnterpriseCount: ensureStats(base.id).serviceEnterpriseIds.size,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取基地列表失败:', error);
    return NextResponse.json({ success: false, error: '获取基地列表失败' }, { status: 500 });
  }
}

/**
 * POST /api/bases
 * 创建基地
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
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

    const { data, error } = await supabase
      .from('bases')
      .insert({
        id: crypto.randomUUID(),
        name: body.name,
        address: body.address || null,
        address_template: body.address_template || null,
        status: body.status || 'active',
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('创建基地失败:', error);
      return NextResponse.json({ success: false, error: '创建基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建基地失败:', error);
    return NextResponse.json({ success: false, error: '创建基地失败' }, { status: 500 });
  }
}
