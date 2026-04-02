import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 强制使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/export-word
 * 导出合同模板为 Word 文档
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: '缺少模板ID' },
        { status: 400 }
      );
    }

    // 获取模板信息
    const { data: template, error: fetchError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { success: false, error: '模板不存在' },
        { status: 404 }
      );
    }

    // 获取原始文件 URL
    const sourceFileUrl = (template as any).source_file_url;
    if (!sourceFileUrl) {
      return NextResponse.json(
        { success: false, error: '模板没有关联的源文件' },
        { status: 400 }
      );
    }

    // 下载原始 Word 文件
    const fileResponse = await fetch(sourceFileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { success: false, error: '下载源文件失败' },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // 返回 Word 文件
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
      },
    });
  } catch (error) {
    console.error('导出 Word 失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    );
  }
}
