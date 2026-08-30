import { createClient } from '@/lib/database/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/enterprises/stats
 * 获取企业统计数据
 */
export async function GET() {
  try {
    const supabase = createClient();

    // 获取所有企业
    const { data: enterprises, error } = await supabase
      .from('enterprises')
      .select('id, type, status');

    if (error) {
      console.error('获取企业统计失败:', error);
      return NextResponse.json(
        { success: false, error: '获取企业统计失败' },
        { status: 500 }
      );
    }

    const [{ data: regNumbers, error: regError }, { data: serviceRelations, error: relationError }] = await Promise.all([
      supabase
        .from('registration_numbers')
        .select('enterprise_id')
        .not('enterprise_id', 'is', null),
      supabase
        .from('enterprise_base_relations')
        .select('enterprise_id')
        .eq('relation_type', 'service')
        .eq('status', 'active'),
    ]);

    if (regError) {
      console.error('获取工位号统计失败:', regError);
    }
    if (relationError) {
      console.error('获取服务企业关系统计失败:', relationError);
    }

    // 去重得到已入驻企业ID集合
    const tenantEnterpriseIds = new Set(
      regNumbers?.map(r => r.enterprise_id).filter(Boolean) || []
    );
    const serviceEnterpriseIds = new Set(
      serviceRelations?.map(relation => relation.enterprise_id).filter(Boolean) || []
    );

    // 计算统计数据
    const stats = {
      total: enterprises?.length || 0,
      // 入驻企业 = 已分配工位号的企业
      tenant: tenantEnterpriseIds.size,
      service: serviceEnterpriseIds.size,
      active: enterprises?.filter(e => e.status === 'active').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('获取企业统计失败:', error);
    return NextResponse.json(
      { success: false, error: '获取企业统计失败' },
      { status: 500 }
    );
  }
}
