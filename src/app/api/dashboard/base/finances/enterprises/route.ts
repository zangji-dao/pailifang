import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/base/finances/enterprises
 * 搜索可用于资金管理的企业：
 * 1. 从 enterprises 表获取已创建的企业档案
 * 2. 从 pi_settlement_applications 获取申请中的企业（已填写企业名）
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
      application_id?: string; // 如果来自申请，记录申请ID
    }>();

    // 1. 从 enterprises 表获取已创建的企业档案
    let enterpriseQuery = supabase
      .from('enterprises')
      .select('id, name, type, status, registration_number')
      .order('name', { ascending: true });

    if (keyword) {
      enterpriseQuery = enterpriseQuery.ilike('name', `%${keyword}%`);
    }

    const { data: enterprises, error: enterpriseError } = await enterpriseQuery;

    if (enterpriseError) {
      console.error('获取企业失败:', enterpriseError);
    }

    // 添加已创建的企业
    (enterprises || []).forEach((e: Record<string, unknown>) => {
      enterpriseMap.set(e.id as string, {
        id: e.id as string,
        name: e.name as string,
        type: e.type as string,
        status: e.status as string,
        address_code: e.registration_number as string | null,
        source: 'enterprise',
      });
    });

    // 2. 从 pi_settlement_applications 获取申请中的企业
    let appQuery = supabase
      .from('pi_settlement_applications')
      .select('id, enterprise_name, approval_status, assigned_address_id')
      .not('enterprise_name', 'is', null)
      .neq('enterprise_name', '')
      .order('enterprise_name', { ascending: true });

    if (keyword) {
      appQuery = appQuery.ilike('enterprise_name', `%${keyword}%`);
    }

    const { data: applications, error: appError } = await appQuery;

    if (appError) {
      console.error('获取申请企业失败:', appError);
    }

    // 添加申请中的企业（排除已创建企业档案的）
    (applications || []).forEach((app: Record<string, unknown>) => {
      const enterpriseName = app.enterprise_name as string;
      const appId = app.id as string;
      
      // 检查是否已经有同名的企业档案
      const existingEnterprise = Array.from(enterpriseMap.values()).find(
        e => e.name === enterpriseName && e.source === 'enterprise'
      );
      
      // 如果没有同名企业档案，添加到列表
      if (!existingEnterprise) {
        // 使用申请ID作为临时标识，加上前缀区分
        const tempId = `app_${appId}`;
        
        // 如果已经添加过这个申请，跳过
        if (!enterpriseMap.has(tempId)) {
          enterpriseMap.set(tempId, {
            id: tempId,
            name: enterpriseName,
            status: (app.approval_status as string) || 'pending',
            source: 'application',
            application_id: appId,
          });
        }
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
