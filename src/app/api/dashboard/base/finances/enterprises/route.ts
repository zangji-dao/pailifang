import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/base/finances/enterprises
 * 搜索可用于资金管理的企业：
 * 1. 从 customers 表获取合作企业
 * 2. 从 pi_registered_addresses 获取已分配地址的企业
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';

    const enterpriseMap = new Map<string, {
      id: string;
      name: string;
      type?: string;
      status?: string;
      address_code?: string | null;
      source?: string;
    }>();

    // 1. 从 customers 表获取企业
    let customerQuery = supabase
      .from('customers')
      .select('id, name, status')
      .eq('status', 'cooperative'); // 只获取合作中的企业

    if (keyword) {
      customerQuery = customerQuery.ilike('name', `%${keyword}%`);
    }

    const { data: customers, error: customerError } = await customerQuery;

    if (customerError) {
      console.error('获取客户企业失败:', customerError);
    }

    // 添加客户企业
    (customers || []).forEach((c: Record<string, unknown>) => {
      enterpriseMap.set(c.id as string, {
        id: c.id as string,
        name: c.name as string,
        status: c.status as string,
        source: 'customer',
      });
    });

    // 2. 从 pi_registered_addresses 获取已分配地址的企业
    let regQuery = supabase
      .from('pi_registered_addresses')
      .select(`
        id,
        enterprise_id,
        address_code,
        enterprises (
          id,
          name,
          type,
          status
        )
      `)
      .not('enterprise_id', 'is', null);

    if (keyword) {
      regQuery = regQuery.ilike('enterprises.name', `%${keyword}%`);
    }

    const { data: regAddresses, error: regError } = await regQuery;

    if (regError) {
      console.error('获取已分配地址企业失败:', regError);
    }

    // 添加已分配地址的企业
    (regAddresses || []).forEach((reg: Record<string, unknown>) => {
      const enterpriseId = reg.enterprise_id as string;
      
      if (enterpriseId && !enterpriseMap.has(enterpriseId)) {
        const enterpriseData = reg.enterprises as Record<string, unknown> | null;
        
        enterpriseMap.set(enterpriseId, {
          id: enterpriseId,
          name: enterpriseData?.name as string || '未知企业',
          type: enterpriseData?.type as string,
          status: enterpriseData?.status as string,
          address_code: reg.address_code as string | null,
          source: 'registered',
        });
      }
    });

    // 3. 从 meters 获取关联了企业的物业
    const { data: meterEnterprises, error: meterError } = await supabase
      .from('meters')
      .select('enterprise_id, enterprises (id, name, type, status)')
      .not('enterprise_id', 'is', null);

    if (meterError) {
      console.error('获取物业关联企业失败:', meterError);
    }

    // 添加物业关联的企业
    (meterEnterprises || []).forEach((m: Record<string, unknown>) => {
      const enterpriseId = m.enterprise_id as string;
      const enterpriseData = m.enterprises as Record<string, unknown> | null;
      
      if (enterpriseId && !enterpriseMap.has(enterpriseId)) {
        enterpriseMap.set(enterpriseId, {
          id: enterpriseId,
          name: enterpriseData?.name as string || '未知企业',
          type: enterpriseData?.type as string,
          status: enterpriseData?.status as string,
          source: 'meter',
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
