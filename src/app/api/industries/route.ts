import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/industries
 * 获取行业列表
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取行业列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取行业列表失败' },
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
    console.error('获取行业列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取行业列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/industries
 * 创建行业
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: '行业名称不能为空' },
        { status: 400 }
      );
    }

    // 检查名称是否已存在
    const { data: existing } = await supabase
      .from('industries')
      .select('id')
      .eq('name', body.name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: '行业名称已存在' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('industries')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建行业失败:', error);
      return NextResponse.json(
        { success: false, error: '创建行业失败' },
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
    console.error('创建行业失败:', error);
    return NextResponse.json(
      { success: false, error: '创建行业失败' },
      { status: 500 }
    );
  }
}
