import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/contract-types/[id]
 * 获取单个合同类型
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('contract_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '合同类型不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        sortOrder: data.sort_order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('获取合同类型详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取合同类型详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contract-types/[id]
 * 更新合同类型
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    // 检查合同类型是否存在
    const { data: existing } = await supabase
      .from('contract_types')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '合同类型不存在' },
        { status: 404 }
      );
    }

    // 如果修改了名称，检查新名称是否已存在
    if (body.name && body.name.trim() !== existing.name) {
      const { data: duplicate } = await supabase
        .from('contract_types')
        .select('id')
        .eq('name', body.name.trim())
        .single();

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: '合同类型名称已存在' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data, error } = await supabase
      .from('contract_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新合同类型失败:', error);
      return NextResponse.json(
        { success: false, error: '更新合同类型失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        sortOrder: data.sort_order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('更新合同类型失败:', error);
    return NextResponse.json(
      { success: false, error: '更新合同类型失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contract-types/[id]
 * 删除合同类型（软删除）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 检查合同类型是否存在
    const { data: existing } = await supabase
      .from('contract_types')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '合同类型不存在' },
        { status: 404 }
      );
    }

    // 软删除
    const { error } = await supabase
      .from('contract_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('删除合同类型失败:', error);
      return NextResponse.json(
        { success: false, error: '删除合同类型失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除合同类型失败:', error);
    return NextResponse.json(
      { success: false, error: '删除合同类型失败' },
      { status: 500 }
    );
  }
}
