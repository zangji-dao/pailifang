import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ParseResult, DetectedAttachment, ContractFieldDefinition, ParsedPage } from '@/types/contract-template';

// 强制使用Node.js运行时
export const runtime = 'nodejs';

/**
 * POST /api/contract-templates/parse
 * 解析已上传的合同文档
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

      // 根据文件类型解析
      let parseResult: ParseResult;
      
      if (fileType === 'pdf') {
        parseResult = await parsePDF(buffer, fileName);
      } else {
        parseResult = await parseWord(buffer, fileName, fileType);
      }

      // 保存解析结果到数据库
      await saveParseResult(supabase, templateId, parseResult);

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
        { success: false, error: '解析文档失败' },
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
 * 解析PDF文档
 */
async function parsePDF(buffer: Buffer, fileName: string): Promise<ParseResult> {
  // 动态导入pdf-parse（避免在Edge Runtime中加载）
  const pdfParse = await import('pdf-parse');
  
  // @ts-expect-error - pdf-parse 动态导入
  const data = await (pdfParse.default || pdfParse)(buffer, {
    max: 0, // 不限制页数
  });

  const pages: ParsedPage[] = [];
  const fullText = data.text;
  
  // pdf-parse不直接提供分页信息，我们需要通过文本推断
  // 这里使用简化处理，将整个文本作为一个页面
  // 后续可以集成pdf-lib获取更精确的分页信息
  pages.push({
    pageNumber: 1,
    text: fullText,
    hasTables: detectTables(fullText),
    hasImages: false,
  });

  // 检测附件
  const detectedAttachments = detectAttachments(fullText, 1, 1);
  
  // 检测可填充字段
  const detectedFields = detectFillableFields(fullText);

  return {
    success: true,
    totalPages: 1,
    fileName,
    fileType: 'pdf',
    pages,
    fullText,
    detectedAttachments,
    detectedFields,
    mainContract: {
      startPage: 1,
      endPage: detectedAttachments.length > 0 ? detectedAttachments[0].startPage : 1,
      pageRange: detectedAttachments.length > 0 ? `1-${detectedAttachments[0].startPage - 1}` : '1',
      content: fullText,
    },
  };
}

/**
 * 解析Word文档
 */
async function parseWord(buffer: Buffer, fileName: string, fileType: string): Promise<ParseResult> {
  // 动态导入mammoth
  const mammoth = await import('mammoth');
  
  const result = await mammoth.extractRawText({ buffer });
  const fullText = result.value;

  const pages: ParsedPage[] = [{
    pageNumber: 1,
    text: fullText,
    hasTables: detectTables(fullText),
    hasImages: false,
  }];

  // 检测附件
  const detectedAttachments = detectAttachments(fullText, 1, 1);
  
  // 检测可填充字段
  const detectedFields = detectFillableFields(fullText);

  return {
    success: true,
    totalPages: 1,
    fileName,
    fileType: fileType as 'docx' | 'doc',
    pages,
    fullText,
    detectedAttachments,
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
 * 检测表格
 */
function detectTables(text: string): boolean {
  // 简单的表格检测：查找连续的分隔符模式
  const tablePatterns = [
    /\|.*\|.*\|/,  // 管道分隔
    /\t.*\t.*\t/,  // 制表符分隔
    /─{3,}/,       // 水平线
  ];
  
  return tablePatterns.some(pattern => pattern.test(text));
}

/**
 * 检测附件分隔
 * 查找"附件一"、"附件二"等关键词
 */
function detectAttachments(text: string, startPage: number, endPage: number): DetectedAttachment[] {
  const attachments: DetectedAttachment[] = [];
  
  // 附件识别正则
  const attachmentPattern = /附件([一二三四五六七八九十\d]+)[：:]\s*(.+?)(?=\n|$)/g;
  
  let match;
  while ((match = attachmentPattern.exec(text)) !== null) {
    const attachmentNum = match[1];
    const attachmentName = match[2].trim();
    
    attachments.push({
      id: `att-${attachmentNum}`,
      name: `附件${attachmentNum}：${attachmentName}`,
      startPage: 1, // 简化处理，实际需要更精确的页码
      endPage: 1,
      pageRange: '1',
      confidence: 0.9,
      content: '', // 需要进一步提取内容
    });
  }

  return attachments;
}

/**
 * 检测可填充字段
 * 查找下划线占位符
 */
function detectFillableFields(text: string): ContractFieldDefinition[] {
  const fields: ContractFieldDefinition[] = [];
  const seen = new Set<string>();
  
  // 下划线占位符模式
  const underlinePattern = /([^\n：:_]+?)[:：]\s*([_＿]{3,})/g;
  
  let match;
  while ((match = underlinePattern.exec(text)) !== null) {
    const label = match[1].trim();
    
    // 跳过太短的标签
    if (label.length < 2) continue;
    
    // 生成字段key
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
 * 保存解析结果到数据库
 */
async function saveParseResult(
  supabase: ReturnType<typeof createClient>,
  templateId: string,
  result: ParseResult
) {
  // 保存识别出的附件
  if (result.detectedAttachments.length > 0) {
    const attachmentsData = result.detectedAttachments.map((att, index) => ({
      id: att.id,
      template_id: templateId,
      name: att.name,
      page_range: att.pageRange,
      auto_detected: true,
      required: false,
      order: index + 1,
    }));

    await supabase
      .from('contract_attachments')
      .insert(attachmentsData);
  }

  // 保存识别出的字段
  if (result.detectedFields.length > 0) {
    const fieldsData = result.detectedFields.map((field, index) => ({
      template_id: templateId,
      field_key: field.key,
      field_label: field.label,
      field_type: field.type,
      default_value: field.defaultValue,
      required: field.required || false,
      sort_order: index,
    }));

    await supabase
      .from('contract_fields')
      .insert(fieldsData);
  }
}
