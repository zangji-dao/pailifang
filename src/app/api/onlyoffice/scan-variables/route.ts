import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const runtime = 'nodejs';

/**
 * 解析 docx 文件中的内容控件（Content Controls）
 * 返回所有内容控件的 Tag 列表
 */
export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json() as { fileUrl: string };

    if (!fileUrl) {
      return NextResponse.json({ error: '缺少 fileUrl 参数' }, { status: 400 });
    }

    // 下载 docx 文件
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `下载文件失败: ${response.status}` },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();

    // 用 JSZip 解析 docx
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = zip.file('word/document.xml');

    if (!documentXml) {
      return NextResponse.json({ keys: [], count: 0 });
    }

    const xmlContent = await documentXml.async('string');

    // 提取内容控件的 Tag 属性
    // 内容控件在 OOXML 中用 w:sdt 元素表示
    // Tag 存储在 w:sdtPr/w:tag/@w:val 中
    const keys: string[] = [];
    const tagRegex = /<w:tag\s+w:val="([^"]*)"/g;
    let match: RegExpExecArray | null;

    // eslint-disable-next-line no-cond-assign
    while ((match = tagRegex.exec(xmlContent)) !== null) {
      const tag = match[1];
      if (tag && !keys.includes(tag)) {
        keys.push(tag);
      }
    }

    // 同时检查附件中的内容控件
    const headerFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith('word/header') || name.startsWith('word/footer')
    );

    for (const fileName of headerFiles) {
      const file = zip.file(fileName);
      if (file) {
        const headerContent = await file.async('string');
        // eslint-disable-next-line no-cond-assign
        while ((match = tagRegex.exec(headerContent)) !== null) {
          const tag = match[1];
          if (tag && !keys.includes(tag)) {
            keys.push(tag);
          }
        }
      }
    }

    return NextResponse.json({ keys, count: keys.length });
  } catch (error) {
    console.error('[ScanVariables] 解析文档失败:', error);
    return NextResponse.json(
      { error: `解析文档失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
