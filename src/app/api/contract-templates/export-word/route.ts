import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { join } from 'path';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';

// 强制使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VariableBinding {
  markerId: string;
  variableKey: string;
}

interface Marker {
  id: string;
  documentId: string;
  variableKey?: string;
  status: 'pending' | 'bound' | 'error';
  position: {
    beforeText: string;
    afterText: string;
    textOffset: number;
    clickContext?: string;
  };
  displayText?: string;
}

interface TemplateVariable {
  id: string;
  name: string;
  key: string;
  type: string;
  category: string;
  defaultValue?: string;
}

interface DraftData {
  markers: Marker[];
  selectedVariables: TemplateVariable[];
  bindings: VariableBinding[];
}

// 预设变量定义（与前端保持一致）
const PresetVariables: TemplateVariable[] = [
  { id: 'var_party_a_name', name: '甲方名称', key: 'party_a_name', type: 'text', category: 'enterprise' },
  { id: 'var_party_a_credit_code', name: '甲方统一社会信用代码', key: 'party_a_credit_code', type: 'text', category: 'enterprise' },
  { id: 'var_party_a_legal_person', name: '甲方法定代表人', key: 'party_a_legal_person', type: 'text', category: 'enterprise' },
  { id: 'var_party_a_address', name: '甲方地址', key: 'party_a_address', type: 'text', category: 'enterprise' },
  { id: 'var_party_a_contact', name: '甲方联系人', key: 'party_a_contact', type: 'text', category: 'enterprise' },
  { id: 'var_party_a_phone', name: '甲方联系电话', key: 'party_a_phone', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_name', name: '乙方名称', key: 'party_b_name', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_credit_code', name: '乙方统一社会信用代码', key: 'party_b_credit_code', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_legal_person', name: '乙方法定代表人', key: 'party_b_legal_person', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_address', name: '乙方地址', key: 'party_b_address', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_contact', name: '乙方联系人', key: 'party_b_contact', type: 'text', category: 'enterprise' },
  { id: 'var_party_b_phone', name: '乙方联系电话', key: 'party_b_phone', type: 'text', category: 'enterprise' },
  { id: 'var_contract_number', name: '合同编号', key: 'contract_number', type: 'text', category: 'contract' },
  { id: 'var_contract_date', name: '签订日期', key: 'contract_date', type: 'date', category: 'date' },
  { id: 'var_start_date', name: '开始日期', key: 'start_date', type: 'date', category: 'date' },
  { id: 'var_end_date', name: '结束日期', key: 'end_date', type: 'date', category: 'date' },
];

/**
 * 在 Word XML 中查找并替换变量标记
 */
function replaceVariablesInXml(
  xmlContent: string,
  draftData: DraftData | null,
  variableValues?: Record<string, string>
): string {
  let result = xmlContent;

  if (!draftData) {
    console.log('没有草稿数据，返回原始内容');
    return result;
  }

  const { markers, selectedVariables } = draftData;

  console.log('开始处理变量替换...');
  console.log('markers 数量:', markers.length);
  console.log('selectedVariables 数量:', selectedVariables.length);

  // 构建 variableKey -> variable 的映射（包含预设变量）
  const variableMap = new Map<string, TemplateVariable>();
  
  // 添加预设变量
  PresetVariables.forEach(v => {
    variableMap.set(v.key, v);
  });
  
  // 添加自定义变量（覆盖预设变量）
  selectedVariables.forEach(v => {
    variableMap.set(v.key, v);
  });

  let replaceCount = 0;

  // 方案 1：查找并替换 {{variableKey}} 格式的标记
  // 这种格式是用户在 Word 文档中手动输入的
  const variableKeyPattern = /\{\{(\w+)\}\}/g;
  result = result.replace(variableKeyPattern, (match, variableKey) => {
    const variable = variableMap.get(variableKey);
    if (!variable) {
      console.log(`未找到变量定义: ${variableKey}`);
      return match;
    }

    replaceCount++;

    // 如果提供了变量值，使用实际值
    if (variableValues && variableValues[variableKey]) {
      console.log(`替换变量 ${variableKey} 为实际值: ${variableValues[variableKey]}`);
      return variableValues[variableKey];
    }

    // 保留变量标记格式，使用变量名称
    console.log(`替换变量标记: {{${variableKey}}} -> {{${variable.name}}}`);
    return `{{${variable.name}}}`;
  });

  // 方案 2：基于 markers 中的位置信息替换
  // 对于每个绑定的标记，尝试通过上下文定位
  markers.forEach(marker => {
    if (marker.status !== 'bound' || !marker.variableKey) return;

    const variable = variableMap.get(marker.variableKey);
    if (!variable) {
      console.log(`未找到变量定义: ${marker.variableKey}`);
      return;
    }

    const { beforeText, afterText } = marker.position;

    // 如果上下文信息都为空，跳过
    if (!beforeText && !afterText) {
      console.log(`标记 ${marker.id} 缺少上下文信息`);
      return;
    }

    try {
      // 在 XML 中查找上下文并替换中间的内容
      // Word XML 中的文本可能被分割成多个 <w:t> 元素
      // 我们使用简化的方式：直接在 XML 字符串中查找

      // 构建正则表达式匹配模式
      // 注意：XML 中的文本可能被 <w:t> 标签分割
      const beforePattern = beforeText
        ? escapeRegExp(beforeText).split('').join('(?:</w:t></w:r><w:r[^>]*><w:t[^>]*>)?')
        : '';
      const afterPattern = afterText
        ? escapeRegExp(afterText).split('').join('(?:</w:t></w:r><w:r[^>]*><w:t[^>]*>)?')
        : '';

      if (beforePattern || afterPattern) {
        // 匹配 beforeText 和 afterText 之间的内容
        // 中间的内容可能是任何文本（包括 <w:t> 标签）
        const pattern = beforePattern
          ? `(${beforePattern})([\\s\\S]{0,200}?)(${afterPattern})`
          : `([\\s\\S]{0,200}?)(${afterPattern})`;

        const regex = new RegExp(pattern, 'g');

        // 检查是否找到匹配
        const matches = result.match(regex);
        if (matches && matches.length > 0) {
          // 替换值
          const replacement = variableValues && variableValues[marker.variableKey]
            ? variableValues[marker.variableKey]
            : `{{${variable.name}}}`;

          // 只替换第一个匹配（避免重复替换）
          result = result.replace(regex, `$1${replacement}$3`);
          replaceCount++;
          console.log(`成功替换标记: ${marker.id} (${marker.variableKey})`);
        }
      }
    } catch (error) {
      console.error(`处理标记 ${marker.id} 时出错:`, error);
    }
  });

  console.log(`总共替换了 ${replaceCount} 处变量标记`);
  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/contract-templates/export-word
 * 导出合同模板为 Word 文档，支持变量替换
 *
 * 请求参数：
 * - templateId: 模板ID（必填）
 * - variableValues: 变量值映射（可选，例如：{ "party_a_name": "张三公司" }）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, variableValues } = body;

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

    // 获取草稿数据
    const draftData = (template as any).draft_data as DraftData | null;
    console.log('草稿数据存在:', !!draftData);

    // 如果有变量绑定数据，进行变量替换
    if (draftData && (draftData.markers?.length > 0 || draftData.selectedVariables?.length > 0)) {
      console.log('开始处理 Word 文档变量替换...');

      try {
        // 创建临时目录
        const tmpDir = join('/tmp', `word-export-${Date.now()}`);
        mkdirSync(tmpDir, { recursive: true });

        // 保存原始文件
        const inputFile = join(tmpDir, 'input.docx');
        writeFileSync(inputFile, Buffer.from(fileBuffer));

        // 使用 AdmZip 解压 Word 文件
        const zip = new AdmZip(inputFile);
        const zipEntries = zip.getEntries();

        // 查找 document.xml 文件
        let documentXmlContent = '';
        let documentXmlPath = '';

        for (const entry of zipEntries) {
          if (entry.entryName === 'word/document.xml') {
            documentXmlContent = entry.getData().toString('utf8');
            documentXmlPath = entry.entryName;
            break;
          }
        }

        if (documentXmlContent) {
          console.log('找到 document.xml，开始替换变量...');

          // 替换变量
          const processedXml = replaceVariablesInXml(
            documentXmlContent,
            draftData,
            variableValues
          );

          // 更新 zip 文件中的 document.xml
          zip.updateFile(documentXmlPath, Buffer.from(processedXml, 'utf8'));

          // 生成新的 Word 文件
          const outputBuffer = zip.toBuffer();

          console.log('Word 文档变量替换完成');

          // 清理临时目录
          try {
            rmSync(tmpDir, { recursive: true, force: true });
          } catch (e) {
            console.error('清理临时目录失败:', e);
          }

          // 返回处理后的 Word 文件
          return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
            },
          });
        } else {
          console.log('未找到 document.xml 文件，返回原始文件');
        }

        // 清理临时目录
        try {
          rmSync(tmpDir, { recursive: true, force: true });
        } catch (e) {
          console.error('清理临时目录失败:', e);
        }
      } catch (processError) {
        console.error('处理 Word 文档时出错:', processError);
        // 处理失败时，返回原始文件
      }
    }

    // 返回原始 Word 文件（没有变量替换或替换失败）
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
