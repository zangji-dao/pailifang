import { NextRequest, NextResponse } from 'next/server';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 为HTML标签添加或合并内联样式
 * 纯前端处理，不依赖LLM，更快更可靠
 */
function addInlineStyles(html: string): string {
  // 定义样式规则
  const styleRules: Array<{ tag: string; style: string }> = [
    { tag: 'h1', style: 'font-size:22px;font-weight:bold;text-align:center;margin:20px 0' },
    { tag: 'h2', style: 'font-size:18px;font-weight:bold;margin:18px 0 10px 0' },
    { tag: 'h3', style: 'font-size:16px;font-weight:bold;margin:15px 0 10px 0' },
    { tag: 'h4', style: 'font-size:15px;font-weight:bold;margin:12px 0 8px 0' },
    { tag: 'h5', style: 'font-size:14px;font-weight:bold;margin:10px 0 6px 0' },
    { tag: 'h6', style: 'font-size:13px;font-weight:bold;margin:8px 0 4px 0' },
    { tag: 'p', style: 'font-size:14px;line-height:2;margin:12px 0;text-indent:2em;text-align:justify' },
    { tag: 'table', style: 'width:100%;border-collapse:collapse;margin:16px 0' },
    { tag: 'td', style: 'border:1px solid #333;padding:8px;vertical-align:top' },
    { tag: 'th', style: 'border:1px solid #333;padding:8px;font-weight:bold;background:#f5f5f5' },
    { tag: 'ul', style: 'margin:12px 0;padding-left:2em;list-style-type:disc' },
    { tag: 'ol', style: 'margin:12px 0;padding-left:2em;list-style-type:decimal' },
    { tag: 'li', style: 'margin:6px 0;line-height:1.8' },
  ];

  let result = html;

  for (const rule of styleRules) {
    const { tag, style } = rule;
    
    // 匹配开始标签，捕获属性部分
    const regex = new RegExp(`<${tag}([^>]*)>`, 'gi');
    
    result = result.replace(regex, (match, attrs) => {
      // 检查是否已有style属性
      const styleMatch = attrs.match(/style\s*=\s*["']([^"']*)["']/i);
      
      if (styleMatch) {
        // 已有style，合并样式
        const existingStyle = styleMatch[1];
        const newStyle = existingStyle.endsWith(';') 
          ? existingStyle + style 
          : existingStyle + ';' + style;
        return `<${tag}${attrs.replace(styleMatch[0], `style="${newStyle}"`)}>`;
      } else {
        // 没有style，添加新的
        return `<${tag} style="${style}"${attrs}>`;
      }
    });
  }

  // 处理强调标签
  result = result.replace(/<(strong|b)([^>]*)>/gi, (match, tag, attrs) => {
    if (/style\s*=/i.test(attrs)) {
      return match; // 已有style，不处理
    }
    return `<${tag} style="font-weight:bold"${attrs}>`;
  });

  // 处理斜体标签
  result = result.replace(/<(em|i)([^>]*)>/gi, (match, tag, attrs) => {
    if (/style\s*=/i.test(attrs)) {
      return match;
    }
    return `<${tag} style="font-style:italic"${attrs}>`;
  });

  return result;
}

/**
 * POST /api/contract-templates/optimize-layout
 * 优化合同文档排版（纯前端处理，快速可靠）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents } = body as {
      documents?: Array<{ id: string; name: string; html: string }>;
      html?: string; // 兼容旧的单文档模式
    };

    // 兼容旧的单文档模式
    const docsToProcess = documents || (body.html ? [{ id: 'main', name: '主合同', html: body.html }] : []);
    
    if (docsToProcess.length === 0) {
      return NextResponse.json({ success: false, error: '缺少HTML内容' }, { status: 400 });
    }

    // 创建一个 TransformStream 用于流式输出
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        sendEvent('start', { total: docsToProcess.length });

        const results: Array<{ id: string; name: string; html: string }> = [];

        // 处理每个文档（速度快，可以并行）
        for (let i = 0; i < docsToProcess.length; i++) {
          const doc = docsToProcess[i];
          
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          // 添加内联样式
          const optimizedHtml = addInlineStyles(doc.html);
          
          results.push({
            id: doc.id,
            name: doc.name,
            html: optimizedHtml,
          });
          
          sendEvent('complete', { documentName: doc.name });
          console.log(`文档 ${doc.name} 排版优化完成`);
        }

        sendEvent('done', { results });
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('优化排版失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '优化排版失败' },
      { status: 500 }
    );
  }
}
