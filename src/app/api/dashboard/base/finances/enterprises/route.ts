import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/base/finances/enterprises
 * 搜索可用于资金管理的企业：
 * 1. 已分配地址的企业
 * 2. 非入驻企业（服务企业）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';

    const enterpriseMap = new Map<string, {
      id: string;
      name: string;
      credit_code?: string | null;
      enterprise_code?: string | null;
      type?: string;
      status?: string;
      address_code?: string | null;
    }>();

    // 1. 获取已分配地址的企业
    let regQuery = supabase
      .from('pi_registered_addresses')
      .select(`
        id,
        enterprise_id,
        assigned_enterprise_name,
        manual_code,
        enterprises (
          id,
          name,
          credit_code,
          enterprise_code,
          type,
          status
        )
      `)
      .not('assigned_enterprise_name', 'is', null);

    if (keyword) {
      regQuery = regQuery.ilike('assigned_enterprise_name', `%${keyword}%`);
    }

    const { data: regAddresses, error: regError } = await regQuery;

    if (regError) {
      console.error('获取已分配地址企业失败:', regError);
    }

    // 添加已分配地址的企业
    (regAddresses || []).forEach((reg: Record<string, unknown>) => {
      const enterpriseId = (reg.enterprise_id as string) || `reg_${reg.id}`;
      
      if (!enterpriseMap.has(enterpriseId)) {
        const enterpriseData = reg.enterprises as Record<string, unknown> | null;
        
        enterpriseMap.set(enterpriseId, {
          id: enterpriseId,
          name: (enterpriseData?.name as string) || (reg.assigned_enterprise_name as string),
          credit_code: enterpriseData?.credit_code as string | null,
          enterprise_code: enterpriseData?.enterprise_code as string | null,
          type: enterpriseData?.type as string,
          status: enterpriseData?.status as string,
          address_code: reg.manual_code as string | null,
        });
      }
    });

    // 2. 获取非入驻企业（服务企业）
    let nonTenantQuery = supabase
      .from('enterprises')
      .select('id, name, credit_code, enterprise_code, type, status')
      .eq('type', 'non_tenant');

    if (keyword) {
      nonTenantQuery = nonTenantQuery.or(
        `name.ilike.%${keyword}%,enterprise_code.ilike.%${keyword}%,credit_code.ilike.%${keyword}%`
      );
    }

    const { data: nonTenantEnterprises, error: nonTenantError } = await nonTenantQuery;

    if (nonTenantError) {
      console.error('获取非入驻企业失败:', nonTenantError);
    }

    // 添加非入驻企业
    (nonTenantEnterprises || []).forEach((e: Record<string, unknown>) => {
      if (!enterpriseMap.has(e.id as string)) {
        enterpriseMap.set(e.id as string, {
          id: e.id as string,
          name: e.name as string,
          credit_code: e.credit_code as string | null,
          enterprise_code: e.enterprise_code as string | null,
          type: e.type as string,
          status: e.status as string,
        });
      }
    });

    // 转换为数组并排序
    const result = Array.from(enterpriseMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'zh-CN')
    );

    return NextResponse.json({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('搜索企业失败:', error);
    return NextResponse.json({ error: '搜索企业失败' }, { status: 500 });
  }
}
