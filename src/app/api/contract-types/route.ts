import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/contract-types
 * 获取合同类型列表
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('contract_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取合同类型列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取合同类型列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sortOrder: item.sort_order,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error('获取合同类型列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取合同类型列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contract-types
 * 创建合同类型
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: '合同类型名称不能为空' },
        { status: 400 }
      );
    }

    // 检查名称是否已存在
    const { data: existing } = await supabase
      .from('contract_types')
      .select('id')
      .eq('name', body.name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: '合同类型名称已存在' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_types')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建合同类型失败:', error);
      return NextResponse.json(
        { success: false, error: '创建合同类型失败' },
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
      },
    }, { status: 201 });
  } catch (error) {
    console.error('创建合同类型失败:', error);
    return NextResponse.json(
      { success: false, error: '创建合同类型失败' },
      { status: 500 }
    );
  }
}
