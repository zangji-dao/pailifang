import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/meters/reorder
 * 批量更新物业排序
 * body: { baseId: string, meterIds: string[] } - meterIds 按新顺序排列
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { baseId, meterIds } = body;

    if (!baseId || !Array.isArray(meterIds)) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    // 批量更新每个物业的 sort_order
    const updates = meterIds.map((meterId: string, index: number) => 
      supabase
        .from('meters')
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq('id', meterId)
        .eq('base_id', baseId) // 确保只更新该基地的物业
    );

    const results = await Promise.all(updates);
    
    // 检查是否有错误
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('更新排序失败:', errors);
      return NextResponse.json(
        { success: false, error: '部分更新失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '排序更新成功',
    });
  } catch (error) {
    console.error('更新排序失败:', error);
    return NextResponse.json(
      { success: false, error: '更新排序失败' },
      { status: 500 }
    );
  }
}
