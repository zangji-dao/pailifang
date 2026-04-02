import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 合同模板接口定义
 */
interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string; // 入驻合同、服务合同等
  status?: 'draft' | 'published'; // 草稿或已发布
  styleConfig: TemplateStyleConfig;
  clauses: TemplateClause[];
  attachments?: ContractAttachment[]; // 合同附件列表
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface TemplateStyleConfig {
  // 页面设置
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  // 字体设置
  font: {
    family: string;
    size: number;
    lineHeight: number;
  };
  titleFont: {
    family: string;
    size: number;
    weight: 'normal' | 'bold';
  };
  // 颜色设置
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
    headerBg: string;
  };
  // 布局设置
  layout: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    showPageNumber: boolean;
    pageNumberPosition: 'left' | 'center' | 'right';
    headerHeight: number;
    footerHeight: number;
  };
  // 条款样式
  clauseStyle: {
    numberingStyle: 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
    indent: number;
    spacing: number;
  };
}

interface TemplateClause {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  editable: boolean;
}

// 合同附件类型
interface ContractAttachment {
  id: string;
  name: string;
  url?: string; // 附件文件URL
  description?: string;
  required: boolean;
  order: number;
}

/**
 * GET /api/contract-templates
 * 获取合同模板列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const templateId = searchParams.get('id');

    // 获取单个模板
    if (templateId) {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('获取合同模板失败:', error);
        return NextResponse.json(
          { success: false, error: '获取合同模板失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: formatTemplate(data),
      });
    }

    // 获取模板列表
    let query = supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取合同模板列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取合同模板列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(formatTemplate),
    });
  } catch (error) {
    console.error('获取合同模板列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取合同模板列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contract-templates
 * 创建合同模板
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const templateId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 默认样式配置
    const defaultStyleConfig: TemplateStyleConfig = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      font: { family: 'SimSun', size: 12, lineHeight: 1.8 },
      titleFont: { family: 'SimHei', size: 18, weight: 'bold' },
      colors: {
        primary: '#1a1a1a',
        secondary: '#666666',
        text: '#333333',
        border: '#e5e5e5',
        headerBg: '#f5f5f5',
      },
      layout: {
        showLogo: true,
        logoPosition: 'center',
        showPageNumber: true,
        pageNumberPosition: 'center',
        headerHeight: 60,
        footerHeight: 40,
      },
      clauseStyle: {
        numberingStyle: 'decimal',
        indent: 24,
        spacing: 12,
      },
    };

    const templateData = {
      id: templateId,
      name: body.name,
      description: body.description || null,
      type: body.type || 'tenant',
      style_config: body.style_config || defaultStyleConfig,
      clauses: body.clauses || [],
      is_default: body.is_default || false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('contract_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('创建合同模板失败:', error);
      return NextResponse.json(
        { success: false, error: `创建合同模板失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatTemplate(data),
    });
  } catch (error) {
    console.error('创建合同模板失败:', error);
    return NextResponse.json(
      { success: false, error: '创建合同模板失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contract-templates
 * 更新合同模板
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id, original_template_id, delete_draft, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少模板ID' },
        { status: 400 }
      );
    }

    // 如果是编辑已发布模板后完成，需要更新原模板并删除草稿
    if (original_template_id) {
      // 更新原模板
      const { data, error } = await supabase
        .from('contract_templates')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', original_template_id)
        .select()
        .single();

      if (error) {
        console.error('更新原模板失败:', error);
        return NextResponse.json(
          { success: false, error: `更新原模板失败: ${error.message}` },
          { status: 500 }
        );
      }

      // 删除草稿
      await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      return NextResponse.json({
        success: true,
        data: formatTemplate(data),
        message: '模板已更新',
      });
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新合同模板失败:', error);
      return NextResponse.json(
        { success: false, error: `更新合同模板失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatTemplate(data),
    });
  } catch (error) {
    console.error('更新合同模板失败:', error);
    return NextResponse.json(
      { success: false, error: '更新合同模板失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contract-templates
 * 删除合同模板（软删除）
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少模板ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contract_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('删除合同模板失败:', error);
      return NextResponse.json(
        { success: false, error: '删除合同模板失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除合同模板失败:', error);
    return NextResponse.json(
      { success: false, error: '删除合同模板失败' },
      { status: 500 }
    );
  }
}

/**
 * 格式化模板数据
 */
function formatTemplate(item: any): ContractTemplate & {
  source_file_url?: string;
  source_file_name?: string;
  source_file_type?: string;
  base_id?: string;
} {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    status: item.status || 'published',
    styleConfig: item.style_config,
    clauses: item.clauses || [],
    attachments: item.attachments || [],
    isDefault: item.is_default,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    source_file_url: item.source_file_url,
    source_file_name: item.source_file_name,
    source_file_type: item.source_file_type,
    base_id: item.base_id,
  };
}
