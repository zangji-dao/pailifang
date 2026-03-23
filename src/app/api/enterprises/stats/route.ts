import { createClient } from '@/lib/supabase/server';
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
      .select('type, status');

    if (error) {
      console.error('获取企业统计失败:', error);
      return NextResponse.json(
        { success: false, error: '获取企业统计失败' },
        { status: 500 }
      );
    }

    // 计算统计数据
    const stats = {
      total: enterprises?.length || 0,
      tenant: enterprises?.filter(e => e.type === 'tenant').length || 0,
      service: enterprises?.filter(e => e.type === 'non_tenant').length || 0,
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
