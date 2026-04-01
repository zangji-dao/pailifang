import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 统计汉字数量
 */
function countChinese(text: string): number {
  return (text.match(/[\u4e00-\u9fa5]/g) || []).length;
}

/**
 * 保护变量标记：{{xxx}} → __VAR_N__
 * 返回替换后的文本和映射表
 */
function protectVariables(text: string): { text: string; varMap: Map<string, string> } {
  const varMap = new Map<string, string>();
  let counter = 0;
  
  // 匹配 {{变量名}} 格式
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const placeholder = `__VAR_${counter}__`;
    varMap.set(placeholder, match);
    counter++;
    return placeholder;
  });
  
  return { text: protectedText, varMap };
}

/**
 * 还原变量标记：__VAR_N__ → {{xxx}}
 */
function restoreVariables(text: string, varMap: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of varMap) {
    result = result.replace(new RegExp(placeholder, 'g'), original);
  }
  return result;
}

/**
 * 提取表格并替换为占位符
 * 返回：替换后的HTML、表格映射表
 */
function extractTables(html: string): { html: string; tables: Map<string, string> } {
  const tables = new Map<string, string>();
  let counter = 0;
  
  // 替换所有表格为占位符
  const processedHtml = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    const placeholder = `__TABLE_${counter}__`;
    tables.set(placeholder, match);
    counter++;
    return placeholder;
  });
  
  return { html: processedHtml, tables };
}

/**
 * 还原表格占位符
 */
function restoreTables(html: string, tables: Map<string, string>): string {
  let result = html;
  for (const [placeholder, tableHtml] of tables) {
    // 对表格应用样式
    const styledTable = styleTable(tableHtml);
    result = result.replace(placeholder, styledTable);
  }
  return result;
}

/**
 * 为表格添加样式
 */
function styleTable(tableHtml: string): string {
  let result = tableHtml;
  
  // 添加表格样式
  if (!/<table[^>]*style/i.test(result)) {
    result = result.replace(/<table/gi, '<table style="width:100%;border-collapse:collapse;margin:16px 0"');
  }
  
  // 添加单元格样式
  result = result.replace(/<td([^>]*)>/gi, (match, attrs) => {
    if (/style\s*=/i.test(attrs)) return match;
    return `<td style="border:1px solid #333;padding:8px;vertical-align:top;white-space:nowrap"${attrs}>`;
  });
  
  // 添加表头样式
  result = result.replace(/<th([^>]*)>/gi, (match, attrs) => {
    if (/style\s*=/i.test(attrs)) return match;
    return `<th style="border:1px solid #333;padding:8px;font-weight:bold;background:#f9f9f9;white-space:nowrap"${attrs}>`;
  });
  
  return result;
}

/**
 * 从HTML中提取纯文本（不含表格）
 */
function extractTextFromHtml(html: string): string {
  let text = html;
  
  // 先移除表格（表格单独处理）
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '');
  
  // 块级元素换行
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  
  // 移除所有HTML标签
  text = text.replace(/<[^>]+>/g, '');
  
  // 解码HTML实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  
  // 清理多余空行
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * LLM系统提示词
 */
const SYSTEM_PROMPT = `你是专业的中文合同排版专家。

你的任务是将纯文本合同转换为格式规范的HTML文档，用于打印PDF。

## 排版规则

### 1. 标题识别与样式
- 合同标题（如"企业入驻协议"）：用 <h1> 标签，居中显示
- 章标题（如"第一章 总则"）：用 <h2> 标签，居中显示
- 节标题（如"第一节 入驻流程"）：用 <h3> 标签，居中显示

### 2. 条款样式
- 条款段落（如"第一条"、"1.1"开头）：用 <p> 标签，条款编号用 <strong> 加粗
- 普通段落：用 <p> 标签，首行缩进2字符

### 3. 表格处理
- 【表格开始】【表格结束】之间的内容用 <table> 标签
- 【行】标记转换为 <tr>
- 【单元格】标记转换为 <td>，设置 white-space: nowrap 防止换行
- 【表头】标记转换为 <th>
- 表格样式：边框1px黑色实线，单元格内边距8px

### 4. 签章区域
- 甲方、乙方签章相关内容：用 <div class="signature"> 包裹，右对齐

## 重要约束
- **绝对不能增加或删除任何汉字**
- 保持 __VAR_N__ 格式的占位符不变
- 只添加HTML标签和内联样式，不修改文本内容

## 输出格式
直接输出HTML内容，不需要 <!DOCTYPE>、<html>、<head>、<body> 等外层标签。

## 样式示例
<h1 style="text-align:center;font-size:22px;font-weight:bold;margin:24px 0;">企业入驻协议</h1>
<h2 style="text-align:center;font-size:18px;font-weight:bold;margin:20px 0;">第一章 总则</h2>
<p style="text-indent:2em;line-height:2;margin:12px 0;"><strong>第一条</strong> 为规范...</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr>
    <td style="border:1px solid #333;padding:8px;white-space:nowrap;">姓名</td>
    <td style="border:1px solid #333;padding:8px;white-space:nowrap;">__VAR_0__</td>
  </tr>
</table>`;

/**
 * POST /api/contract-templates/optimize-layout
 * LLM直接返回带样式的HTML，校验汉字数量
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents } = body as {
      documents?: Array<{ id: string; name: string; html: string }>;
      html?: string;
    };

    const docsToProcess = documents || (body.html ? [{ id: 'main', name: '主合同', html: body.html }] : []);
    
    if (docsToProcess.length === 0) {
      return NextResponse.json({ success: false, error: '缺少HTML内容' }, { status: 400 });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('start', { total: docsToProcess.length });
        const results: Array<{ id: string; name: string; html: string }> = [];

        for (let i = 0; i < docsToProcess.length; i++) {
          const doc = docsToProcess[i];
          
          sendEvent('progress', {
            current: i + 1,
            total: docsToProcess.length,
            documentName: doc.name,
            documentId: doc.id
          });

          try {
            // 1. 提取纯文本
            const plainText = extractTextFromHtml(doc.html);
            
            // 2. 保护变量标记
            const { text: protectedText, varMap } = protectVariables(plainText);
            
            // 3. 统计汉字数量
            const originalChineseCount = countChinese(protectedText);
            
            console.log(`文档 ${doc.name}: 提取文本 ${plainText.length} 字符，汉字 ${originalChineseCount} 个，变量 ${varMap.size} 个`);
            
            // 4. 构建用户提示词
            const userPrompt = `请将以下合同文本转换为格式规范的HTML。

原文共 ${originalChineseCount} 个汉字。
要求：返回结果的汉字数量必须完全等于 ${originalChineseCount}，不能多也不能少。

合同文本：
${protectedText}`;

            // 5. 发送给LLM
            const llmResponse = await client.invoke([
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ], {
              model: 'doubao-seed-2-0-lite-260215',
              temperature: 0.1,
            });
            
            const llmResult = llmResponse.content;
            
            // 6. 校验汉字数量
            const resultChineseCount = countChinese(llmResult);
            
            if (resultChineseCount !== originalChineseCount) {
              console.error(`汉字数量不匹配: 原文 ${originalChineseCount}，返回 ${resultChineseCount}`);
              sendEvent('error', { 
                documentName: doc.name, 
                message: `内容校验失败：原文${originalChineseCount}字，返回${resultChineseCount}字，请重试` 
              });
              // 使用原文，应用基础样式
              const fallbackHtml = applyFallbackStyles(doc.html);
              results.push({ id: doc.id, name: doc.name, html: fallbackHtml });
              continue;
            }
            
            console.log(`文档 ${doc.name}: LLM返回 ${llmResult.length} 字符，汉字 ${resultChineseCount} 个，校验通过`);
            
            // 7. 还原变量标记
            const finalHtml = restoreVariables(llmResult, varMap);
            
            results.push({ id: doc.id, name: doc.name, html: finalHtml });
            sendEvent('complete', { documentName: doc.name });
            console.log(`文档 ${doc.name} 排版优化完成`);
            
          } catch (error) {
            console.error(`处理文档 ${doc.name} 失败:`, error);
            // 失败时应用基础样式
            const fallbackHtml = applyFallbackStyles(doc.html);
            results.push({ id: doc.id, name: doc.name, html: fallbackHtml });
            sendEvent('warning', { documentName: doc.name, message: '智能分析失败，已应用基础样式' });
          }
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

/**
 * 兜底样式：当LLM失败时应用基础样式
 */
function applyFallbackStyles(html: string): string {
  let result = html;
  
  // 为各种标签添加基础样式
  const addStyle = (html: string, tag: string, style: string): string => {
    const regex = new RegExp(`<${tag}([^>]*)>`, 'gi');
    return html.replace(regex, (match, attrs) => {
      if (/style\s*=/i.test(attrs)) return match;
      return `<${tag} style="${style}"${attrs}>`;
    });
  };
  
  result = addStyle(result, 'h1', 'text-align:center;font-size:22px;font-weight:bold;margin:24px 0');
  result = addStyle(result, 'h2', 'text-align:center;font-size:18px;font-weight:bold;margin:20px 0');
  result = addStyle(result, 'h3', 'text-align:center;font-size:16px;font-weight:bold;margin:16px 0');
  result = addStyle(result, 'p', 'text-indent:2em;line-height:2;margin:12px 0');
  result = addStyle(result, 'table', 'width:100%;border-collapse:collapse;margin:16px 0');
  result = addStyle(result, 'td', 'border:1px solid #333;padding:8px;vertical-align:top;white-space:nowrap');
  result = addStyle(result, 'th', 'border:1px solid #333;padding:8px;font-weight:bold;background:#f5f5f5;white-space:nowrap');
  
  return result;
}
