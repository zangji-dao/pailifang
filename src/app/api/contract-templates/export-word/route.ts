import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { asBlob } from 'html-docx-js-typescript';
import AdmZip from 'adm-zip';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

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
 * 生成单个文档片段（HTML 转 Word chunk）
 */
async function generateChunk(htmlContent: string): Promise<Buffer> {
  const docxResult = await asBlob(htmlContent, {
    margins: {
      top: 1440,
      right: 1440,
      bottom: 1440,
      left: 1440,
    },
  });

  if (Buffer.isBuffer(docxResult)) {
    return docxResult;
  }
  const arrayBuffer = await (docxResult as Blob).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 构建原生 Word XML 文档结构，每个附件独立一个 chunk
 */
function buildWordDocumentXml(chunkIds: string[]): string {
  const chunks = chunkIds.map((id, index) => {
    // 如果不是第一个 chunk，前面加分页符
    if (index > 0) {
      return `    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>
    <w:altChunk r:id="${id}" />`;
    }
    return `    <w:altChunk r:id="${id}" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
${chunks}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840" w:orient="portrait" />
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"
               w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/**
 * 构建 document.xml.rels 文件
 */
function buildRelsXml(chunkIds: string[]): string {
  const relationships = chunkIds.map((id, index) => {
    return `    <Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/afChunk" Target="chunk${index}.mht"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
${relationships}
</Relationships>`;
}

/**
 * POST /api/contract-templates/export-word
 * 基于 HTML 内容导出 Word 文档（每个附件独立分页）
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

    console.log('开始导出 Word 文档...');
    console.log('附件数量:', draftData.attachments?.length || 0);

    // 处理变量替换的函数
    const processVariables = (html: string): string => {
      let result = html;
      
      // 如果提供了 variableValues，替换变量值
      if (variableValues && Object.keys(variableValues).length > 0) {
        for (const [key, value] of Object.entries(variableValues)) {
          const varPattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          result = result.replace(varPattern, value as string);
        }
      }

      // 将变量标记从 {{variableKey}} 转换为 {{变量名}}
      if (draftData.selectedVariables) {
        for (const variable of draftData.selectedVariables) {
          const keyPattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
          result = result.replace(keyPattern, `{{${variable.name}}}`);
        }
      }

      // 清理 marker 相关的 HTML 属性
      result = result.replace(/\s*data-marker-id="[^"]*"/g, '');
      result = result.replace(/\s*data-document-id="[^"]*"/g, '');
      result = result.replace(/\s*class="variable-marker[^"]*"/g, '');
      result = result.replace(/<span\s+[^>]*style="[^"]*"[^>]*>(\{\{[^}]+\}\})<\/span>/g, '$1');

      // 清理分页样式，避免每行都另起一页
      // 移除 page-break-before 和 page-break-after 样式
      result = result.replace(/page-break-before:\s*[^;]+;?/gi, '');
      result = result.replace(/page-break-after:\s*[^;]+;?/gi, '');
      result = result.replace(/page-break-inside:\s*[^;]+;?/gi, '');
      // 清理空的 style 属性
      result = result.replace(/\s*style="\s*"/g, '');

      // 修复表格边框 - Word 对 CSS border 支持有限，需要添加 HTML 属性
      // 为没有 border 属性的 table 添加 border="1" 和 bordercolor
      result = result.replace(/<table(?![^>]*\sborder\s*=)[^>]*>/gi, (match) => {
        // 检查是否已有 border 属性
        if (match.includes('border=')) {
          return match;
        }
        // 添加 border="1" bordercolor="#000000" style="border-collapse: collapse"
        if (match.includes('style="')) {
          return match.replace('style="', 'border="1" bordercolor="#000000" style="border-collapse: collapse; ');
        }
        return match.replace('<table', '<table border="1" bordercolor="#000000" style="border-collapse: collapse"');
      });

      // 确保 td/th 有边框样式
      result = result.replace(/<td(?![^>]*style[^>]*border)[^>]*>/gi, (match) => {
        if (match.includes('style="')) {
          return match.replace('style="', 'style="border: 1px solid #000000; ');
        }
        return match.replace('<td', '<td style="border: 1px solid #000000"');
      });
      result = result.replace(/<th(?![^>]*style[^>]*border)[^>]*>/gi, (match) => {
        if (match.includes('style="')) {
          return match.replace('style="', 'style="border: 1px solid #000000; ');
        }
        return match.replace('<th', '<th style="border: 1px solid #000000"');
      });

      return result;
    };

    // 准备所有 HTML 内容
    const htmlParts: string[] = [];
    
    // 主文档
    if (draftData.editedHtml) {
      htmlParts.push(processVariables(draftData.editedHtml));
    }
    
    // 附件
    if (draftData.attachments && draftData.attachments.length > 0) {
      for (const attachment of draftData.attachments) {
        if (attachment.html) {
          htmlParts.push(processVariables(attachment.html));
        }
      }
    }

    if (htmlParts.length === 0) {
      return NextResponse.json({ success: false, error: '没有找到文档内容' }, { status: 400 });
    }

    // 创建临时目录
    const tmpDir = join('/tmp', `word-export-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
      // 为每个 HTML 部分生成 Word chunk
      const chunkIds: string[] = [];
      const zip = new AdmZip();

      // 添加基础文件结构
      zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="mht" ContentType="message/rfc822"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`));

      // 添加 styles.xml（基础样式）
      zip.addFile('word/styles.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="仿宋" w:eastAsia="仿宋" w:hAnsi="仿宋"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`));

      // 为每个 HTML 部分生成 chunk
      for (let i = 0; i < htmlParts.length; i++) {
        const htmlContent = htmlParts[i];
        const chunkId = `chunk${i}`;
        chunkIds.push(chunkId);

        console.log(`生成 chunk ${i + 1}/${htmlParts.length}, HTML 长度: ${htmlContent.length}`);

        // 生成单个 chunk 的 Word 文件
        const chunkBuffer = await generateChunk(htmlContent);
        
        // 提取 MHT 内容
        const chunkZip = new AdmZip(chunkBuffer);
        const mhtEntry = chunkZip.getEntry('word/afchunk.mht');
        
        if (mhtEntry) {
          // 保存为独立的 MHT 文件
          zip.addFile(`word/chunk${i}.mht`, mhtEntry.getData());
        }
      }

      // 构建 document.xml（包含所有 chunks 和分页符）
      const documentXml = buildWordDocumentXml(chunkIds);
      zip.addFile('word/document.xml', Buffer.from(documentXml));

      // 构建 document.xml.rels
      const relsXml = buildRelsXml(chunkIds);
      zip.addFile('word/_rels/document.xml.rels', Buffer.from(relsXml));

      // 添加 _rels/.rels
      zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`));

      // 生成最终的 Word 文件
      const outputBuffer = zip.toBuffer();

      console.log('Word 文档生成成功，总大小:', outputBuffer.length);

      rmSync(tmpDir, { recursive: true, force: true });

      return new NextResponse(outputBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
        },
      });

    } catch (processError) {
      console.error('处理 Word 文档时出错:', processError);
      rmSync(tmpDir, { recursive: true, force: true });
      throw processError;
    }

  } catch (error) {
    console.error('导出 Word 失败:', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
