import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/spaces/[id]
 * 更新物理空间信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const { name, area, status } = body;

    // 构建更新对象
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('spaces')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新空间失败:', error);
      return NextResponse.json(
        { success: false, error: '更新空间失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('更新空间失败:', error);
    return NextResponse.json(
      { success: false, error: '更新空间失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/spaces/[id]
 * 删除物理空间
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 检查空间下是否有关联的工位号
    const { data: regNumbers, error: checkError } = await supabase
      .from('registration_numbers')
      .select('id')
      .eq('space_id', id);

    if (checkError) {
      console.error('检查工位号失败:', checkError);
      return NextResponse.json(
        { success: false, error: '检查工位号失败' },
        { status: 500 }
      );
    }

    if (regNumbers && regNumbers.length > 0) {
      return NextResponse.json(
        { success: false, error: '该空间下有工位号，无法删除' },
        { status: 400 }
      );
    }

    // 删除空间
    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除空间失败:', error);
      return NextResponse.json(
        { success: false, error: '删除空间失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('删除空间失败:', error);
    return NextResponse.json(
      { success: false, error: '删除空间失败' },
      { status: 500 }
    );
  }
}
