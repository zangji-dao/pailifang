import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, ContractFieldDefinition, ParsedPage } from '@/types/contract-template';

// 强制使用Node.js运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contract-templates/parse
 * 解析已上传的合同文档（仅 Word 文档）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, fileUrl, fileName, fileType } = body;

    if (!templateId || !fileUrl) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (fileType !== 'docx' && fileType !== 'doc') {
      return NextResponse.json(
        { success: false, error: '仅支持 Word 文档解析' },
        { status: 400 }
      );
    }

    // 更新解析状态
    await supabase
      .from('contract_templates')
      .update({ parse_status: 'parsing', updated_at: new Date().toISOString() })
      .eq('id', templateId);

    try {
      // 下载文件内容
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('下载文件失败');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 解析 Word 文档
      const parseResult = await parseWord(buffer, fileName, fileType);

      // 保存识别出的字段到数据库
      await saveFields(supabase, templateId, parseResult.detectedFields);

      // 更新解析状态为完成
      await supabase
        .from('contract_templates')
        .update({ 
          parse_status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', templateId);

      return NextResponse.json({
        success: true,
        data: parseResult,
      });
    } catch (parseError) {
      console.error('解析文档失败:', parseError);
      
      // 更新解析状态为失败
      await supabase
        .from('contract_templates')
        .update({ 
          parse_status: 'failed',
          parse_error: parseError instanceof Error ? parseError.message : '解析失败',
          updated_at: new Date().toISOString() 
        })
        .eq('id', templateId);

      return NextResponse.json(
        { success: false, error: parseError instanceof Error ? parseError.message : '解析文档失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('解析请求失败:', error);
    return NextResponse.json(
      { success: false, error: '解析请求失败' },
      { status: 500 }
    );
  }
}

/**
 * 解析Word文档 - 同时返回文本和HTML
 */
async function parseWord(buffer: Buffer, fileName: string, fileType: string): Promise<ParseResult> {
  // 动态导入mammoth
  const mammoth = await import('mammoth');
  
  // 提取纯文本
  const textResult = await mammoth.extractRawText({ buffer });
  const fullText = textResult.value;
  
  // 提取HTML（保留格式）
  const htmlResult = await mammoth.convertToHtml({ buffer });
  let html = htmlResult.value;
  
  // 处理HTML，标记下划线区域为可点击的字段
  html = markFieldsInHtml(html, fullText);

  const pages: ParsedPage[] = [{
    pageNumber: 1,
    text: fullText,
    html: html,
    hasTables: detectTables(fullText),
    hasImages: false,
  }];

  // 检测可填充字段
  const detectedFields = detectFillableFields(fullText);

  return {
    success: true,
    totalPages: 1,
    fileName,
    fileType: fileType as 'docx' | 'doc',
    pages,
    fullText,
    html: html,
    detectedAttachments: [],
    detectedFields,
    mainContract: {
      startPage: 1,
      endPage: 1,
      pageRange: '1',
      content: fullText,
    },
  };
}

/**
 * 标记HTML中的下划线字段为可点击区域
 */
function markFieldsInHtml(html: string, rawText: string): string {
  let fieldIndex = 0;
  const fieldMap = new Map<string, { id: string; key: string; label: string }>();
  
  // 方案1: 处理 <u> 标签（Word下划线样式）
  // 匹配冒号后紧跟的 <u> 标签内容
  html = html.replace(
    /([^\n<：:>]+?)[：:]\s*(<u>([^<]*)<\/u>)/g,
    (match, label, uTag, uContent) => {
      const trimmedLabel = label.trim();
      // 过滤掉太短的标签或纯数字
      if (trimmedLabel.length < 2 || /^\d+$/.test(trimmedLabel)) return match;
      
      const fieldId = `field-${fieldIndex++}`;
      const key = trimmedLabel
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      fieldMap.set(fieldId, { id: fieldId, key, label: trimmedLabel });
      
      // 将下划线标签替换为可点击的标记
      return `<span class="field-label">${trimmedLabel}：</span><span class="field-placeholder" data-field-id="${fieldId}" data-field-key="${key}" data-field-label="${trimmedLabel}" data-selected="false">${uTag}</span>`;
    }
  );
  
  // 方案2: 处理纯文本下划线
  const underlinePattern = /([^\n：:>]+?)[：:]\s*([_＿\s]{3,})/g;
  html = html.replace(underlinePattern, (match, label, underlines) => {
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 2 || /^\d+$/.test(trimmedLabel)) return match;
    
    // 如果这个标签已经被处理过（方案1），跳过
    if (html.includes(`data-field-label="${trimmedLabel}"`)) return match;
    
    const fieldId = `field-${fieldIndex++}`;
    const key = trimmedLabel
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `<span class="field-label">${trimmedLabel}：</span><span class="field-placeholder" data-field-id="${fieldId}" data-field-key="${key}" data-field-label="${trimmedLabel}" data-selected="false">${underlines}</span>`;
  });
  
  // 方案3: 处理独立的 <u> 标签（没有冒号前缀的）
  html = html.replace(
    /<u>([^<]{3,})<\/u>/g,
    (match, uContent) => {
      // 如果已经处理过，跳过
      if (match.includes('field-placeholder')) return match;
      
      const fieldId = `field-${fieldIndex++}`;
      const content = uContent.trim();
      
      // 如果内容是空格或下划线，标记为可点击
      if (/^[\s_＿]+$/.test(content)) {
        return `<span class="field-placeholder" data-field-id="${fieldId}" data-field-key="field_${fieldIndex}" data-field-label="填充字段" data-selected="false"><u>${content}</u></span>`;
      }
      
      return match;
    }
  );
  
  // 方案4: 处理日期格式：____年____月____日
  const datePattern = /([_＿\s]{2,})年([_＿\s]{2,})月([_＿\s]{2,})日/g;
  html = html.replace(datePattern, (match) => {
    const fieldId = `field-${fieldIndex++}`;
    return `<span class="field-placeholder field-date" data-field-id="${fieldId}" data-field-key="date" data-field-label="日期" data-selected="false">${match}</span>`;
  });
  
  // 方案5: 处理 Word 中下划线加空格的情况
  // <u> </u> 或 <u>  </u> 等
  html = html.replace(
    /<u>(\s+)<\/u>/g,
    (match, spaces) => {
      if (spaces.length < 3) return match;
      
      const fieldId = `field-${fieldIndex++}`;
      return `<span class="field-placeholder" data-field-id="${fieldId}" data-field-key="field_${fieldIndex}" data-field-label="填充字段" data-selected="false"><u>${spaces}</u></span>`;
    }
  );
  
  // 不再添加内联样式，由前端组件统一处理
  return html;
}

/**
 * 检测表格
 */
function detectTables(text: string): boolean {
  const tablePatterns = [
    /\|.*\|.*\|/,
    /\t.*\t.*\t/,
    /─{3,}/,
  ];
  
  return tablePatterns.some(pattern => pattern.test(text));
}

/**
 * 检测可填充字段
 */
function detectFillableFields(text: string): ContractFieldDefinition[] {
  const fields: ContractFieldDefinition[] = [];
  const seen = new Set<string>();
  
  // 下划线占位符模式
  const underlinePattern = /([^\n：:_]+?)[:：]\s*([_＿\s]{3,})/g;
  
  let match;
  while ((match = underlinePattern.exec(text)) !== null) {
    const label = match[1].trim();
    
    if (label.length < 2 || /^\d+$/.test(label)) continue;
    
    const key = label
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    if (seen.has(key)) continue;
    seen.add(key);
    
    fields.push({
      key,
      label,
      type: inferFieldType(label),
      required: false,
    });
  }

  // 日期字段模式
  const datePattern = /____年____月____日/g;
  if (datePattern.test(text) && !seen.has('date')) {
    fields.push({
      key: 'date',
      label: '日期',
      type: 'date',
      required: true,
    });
  }

  return fields;
}

/**
 * 根据标签推断字段类型
 */
function inferFieldType(label: string): 'text' | 'date' | 'number' | 'select' {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('日期') || lowerLabel.includes('时间') || lowerLabel.includes('年月日')) {
    return 'date';
  }
  if (lowerLabel.includes('金额') || lowerLabel.includes('数量') || lowerLabel.includes('价格') || lowerLabel.includes('电话')) {
    return 'number';
  }
  
  return 'text';
}

/**
 * 保存字段到数据库
 */
async function saveFields(
  supabase: ReturnType<typeof createClient>,
  templateId: string,
  fields: ContractFieldDefinition[]
) {
  if (fields.length === 0) return;

  const fieldsData = fields.map((field, index) => ({
    template_id: templateId,
    field_key: field.key,
    field_label: field.label,
    field_type: field.type,
    default_value: field.defaultValue || null,
    required: field.required || false,
    sort_order: index,
  }));

  const { error } = await supabase
    .from('contract_fields')
    .insert(fieldsData);
  
  if (error) {
    console.error('保存字段失败:', error);
  }
}
