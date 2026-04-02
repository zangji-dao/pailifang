import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { asBlob } from 'html-docx-js-typescript';

// 强制使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Marker {
  id: string;
  documentId: string;
  variableKey?: string;
  status: 'pending' | 'bound' | 'error';
  position: {
    beforeText: string;
    afterText: string;
    textOffset: number;
  };
  displayText?: string;
}

interface TemplateVariable {
  id: string;
  name: string;
  key: string;
  type: string;
  category: string;
}

interface Attachment {
  id: string;
  url: string;
  html: string;
  name?: string;
}

interface DraftData {
  markers: Marker[];
  selectedVariables: TemplateVariable[];
  editedHtml?: string;
  attachments?: Attachment[];
}

/**
 * 构建完整的 HTML 文档（主文档 + 附件）
 */
function buildCompleteHtml(draftData: DraftData): string {
  const parts: string[] = [];
  
  // 添加主文档
  if (draftData.editedHtml) {
    parts.push(draftData.editedHtml);
  }
  
  // 添加附件
  if (draftData.attachments && draftData.attachments.length > 0) {
    for (const attachment of draftData.attachments) {
      if (attachment.html) {
        // 添加分页符和附件内容
        parts.push(`
          <div style="page-break-before: always;"></div>
          <div class="attachment-content" data-attachment-id="${attachment.id}">
            ${attachment.html}
          </div>
        `);
      }
    }
  }
  
  return parts.join('\n');
}

/**
 * POST /api/contract-templates/export-word
 * 基于 HTML 内容导出 Word 文档（包含主文档和附件）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, variableValues } = body;

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

    const draftData = (template as any).draft_data as DraftData | null;
    
    if (!draftData) {
      return NextResponse.json({ success: false, error: '没有找到草稿数据' }, { status: 400 });
    }

    // 构建完整的 HTML（主文档 + 附件）
    let htmlContent = buildCompleteHtml(draftData);

    if (!htmlContent) {
      return NextResponse.json({ success: false, error: '没有找到文档内容' }, { status: 400 });
    }

    console.log('开始导出 Word 文档...');
    console.log('HTML 内容长度:', htmlContent.length);
    console.log('附件数量:', draftData.attachments?.length || 0);

    // 如果提供了 variableValues，替换变量值
    if (variableValues && Object.keys(variableValues).length > 0) {
      for (const [key, value] of Object.entries(variableValues)) {
        // 替换 {{变量名}} 格式
        const varPattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        htmlContent = htmlContent.replace(varPattern, value as string);
      }
      console.log('已替换变量值:', Object.keys(variableValues));
    }

    // 将变量标记从 {{variableKey}} 转换为 {{变量名}}（用于显示）
    if (draftData.selectedVariables) {
      for (const variable of draftData.selectedVariables) {
        const keyPattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
        htmlContent = htmlContent.replace(keyPattern, `{{${variable.name}}}`);
      }
    }

    // 清理 marker 相关的 HTML 属性（保留内容）
    htmlContent = htmlContent.replace(/\s*data-marker-id="[^"]*"/g, '');
    htmlContent = htmlContent.replace(/\s*data-document-id="[^"]*"/g, '');
    htmlContent = htmlContent.replace(/\s*class="variable-marker[^"]*"/g, '');
    // 清理变量标记的 span 标签，只保留内容
    htmlContent = htmlContent.replace(/<span\s+[^>]*style="[^"]*"[^>]*>(\{\{[^}]+\}\})<\/span>/g, '$1');

    // 添加基础 HTML 结构（如果没有的话）
    if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: '仿宋', Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #000; padding: 4pt 8pt; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    }

    try {
      // 使用 html-docx-js 将 HTML 转换为 Word
      const docxResult = await asBlob(htmlContent, {
        margins: {
          top: 1440,    // 1 inch = 1440 twips
          right: 1440,
          bottom: 1440,
          left: 1440,
        },
      });

      console.log('Word 文档生成成功');

      // 转换为 ArrayBuffer 确保类型兼容
      let outputBuffer: ArrayBuffer;
      if (Buffer.isBuffer(docxResult)) {
        outputBuffer = docxResult.buffer.slice(docxResult.byteOffset, docxResult.byteOffset + docxResult.byteLength) as ArrayBuffer;
      } else {
        // Blob 类型
        outputBuffer = await (docxResult as Blob).arrayBuffer();
      }

      return new NextResponse(outputBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
        },
      });
    } catch (convertError) {
      console.error('HTML 转 Word 失败:', convertError);
      return NextResponse.json({ 
        success: false, 
        error: '文档转换失败，请检查文档格式' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('导出 Word 失败:', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
