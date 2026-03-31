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

  // 检测可填充字段
  const detectedFields = detectFillableFields(fullText);

  return {
    success: true,
    totalPages: 1,
    fileName,
    fileType: fileType as 'docx' | 'doc',
    pages,
    fullText,
    detectedAttachments: [], // 不再自动检测附件
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
  const tablePatterns = [
    /\|.*\|.*\|/,  // 管道分隔
    /\t.*\t.*\t/,  // 制表符分隔
    /─{3,}/,       // 水平线
  ];
  
  return tablePatterns.some(pattern => pattern.test(text));
}

/**
 * 检测可填充字段
 * 查找下划线占位符
 */
function detectFillableFields(text: string): ContractFieldDefinition[] {
  const fields: ContractFieldDefinition[] = [];
  const seen = new Set<string>();
  
  // 下划线占位符模式：标签后跟下划线
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
