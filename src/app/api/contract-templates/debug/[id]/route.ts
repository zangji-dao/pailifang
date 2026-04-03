import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 强制使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/contract-templates/debug/[id]
 * 调试接口：获取模板的详细信息，包括 HTML 内容片段
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id: templateId } = await params;

    if (!templateId) {
      return NextResponse.json({ success: false, error: '缺少模板ID' }, { status: 400 });
    }

    const { data: template, error: fetchError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ success: false, error: '模板不存在' }, { status: 404 });
    }

    const draftData = (template as any).draft_data;
    
    // 提取 HTML 内容片段（用于调试）
    let htmlFragments: {
      source: string;
      length: number;
      preview: string;
    }[] = [];

    // 主文档 HTML
    if (draftData?.editedHtml) {
      htmlFragments.push({
        source: 'editedHtml',
        length: draftData.editedHtml.length,
        preview: draftData.editedHtml.substring(0, 2000),
      });
    }
    
    if (draftData?.originalHtml) {
      htmlFragments.push({
        source: 'originalHtml',
        length: draftData.originalHtml.length,
        preview: draftData.originalHtml.substring(0, 2000),
      });
    }

    // 附件 HTML
    if (draftData?.attachments && Array.isArray(draftData.attachments)) {
      draftData.attachments.forEach((att: any, index: number) => {
        if (att.html) {
          htmlFragments.push({
            source: `attachment-${index}-${att.name || 'unnamed'}`,
            length: att.html.length,
            preview: att.html.substring(0, 1000),
          });
        }
      });
    }

    // 搜索签章区域相关的内容
    const sealPatterns = [
      /签章|盖章|甲方|乙方|处\s*、\s*处/g,
      /代表|签字|印章/g,
    ];
    
    let sealAreaMatches: { pattern: string; matches: string[] }[] = [];
    
    if (draftData?.editedHtml) {
      sealPatterns.forEach((pattern, index) => {
        const matches = draftData.editedHtml.match(pattern) || [];
        if (matches.length > 0) {
          sealAreaMatches.push({
            pattern: `pattern-${index}`,
            matches: matches.slice(0, 10), // 最多显示10个匹配
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        status: template.status,
        type: template.type,
        source_file_url: (template as any).source_file_url,
        source_file_name: (template as any).source_file_name,
        hasDraftData: !!draftData,
        draftDataInfo: draftData ? {
          currentStep: draftData.currentStep,
          editedHtmlLength: draftData.editedHtml?.length || 0,
          originalHtmlLength: draftData.originalHtml?.length || 0,
          markersCount: draftData.markers?.length || 0,
          selectedVariablesCount: draftData.selectedVariables?.length || 0,
          attachmentsCount: draftData.attachments?.length || 0,
        } : null,
        htmlFragments,
        sealAreaMatches,
      },
    });
  } catch (error) {
    console.error('调试接口错误:', error);
    return NextResponse.json(
      { success: false, error: '获取调试信息失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
