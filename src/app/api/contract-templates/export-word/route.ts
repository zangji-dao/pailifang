import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

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
}

interface TemplateVariable {
  id: string;
  name: string;
  key: string;
  type: string;
  category: string;
}

interface DraftData {
  markers: Marker[];
  selectedVariables: TemplateVariable[];
}

// 预设变量
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
  { id: 'var_room_number', name: '房间号', key: 'room_number', type: 'text', category: 'location' },
];

/**
 * 在 Word XML 中按顺序替换变量
 * 关键：使用计数器确保每个上下文只被匹配一次
 */
function replaceVariablesInXml(
  xmlContent: string,
  draftData: DraftData | null,
  variableValues?: Record<string, string>
): string {
  if (!draftData) {
    console.log('没有草稿数据，返回原始内容');
    return xmlContent;
  }

  const { markers, selectedVariables } = draftData;
  console.log('开始处理变量替换...');
  console.log('markers 数量:', markers.length);

  // 构建 variableKey -> variable 的映射
  const variableMap = new Map<string, TemplateVariable>();
  PresetVariables.forEach(v => variableMap.set(v.key, v));
  selectedVariables.forEach(v => variableMap.set(v.key, v));

  let result = xmlContent;
  let totalReplaced = 0;

  // 记录每个 beforeText 已经被使用的次数
  const contextUsageCount = new Map<string, number>();

  // 按 markers 顺序处理每个绑定
  for (const marker of markers) {
    if (marker.status !== 'bound' || !marker.variableKey) continue;

    const variableKey = marker.variableKey;
    const variable = variableMap.get(variableKey);
    if (!variable) {
      console.log(`未找到变量定义: ${variableKey}`);
      continue;
    }

    const { beforeText, afterText } = marker.position;
    if (!beforeText) continue;

    // 获取这个 beforeText 应该匹配第几个出现位置
    const usageIndex = contextUsageCount.get(beforeText) || 0;
    contextUsageCount.set(beforeText, usageIndex + 1);

    // 构建匹配模式：找到 beforeText 后面的空文本或下划线文本
    const escapedBeforeText = escapeRegExp(beforeText);
    
    // 模式：<w:t>beforeText</w:t>...<w:t>要替换的内容</w:t>
    // 要替换的内容通常是：空格、下划线、或很短的占位符
    const pattern = new RegExp(
      `(<w:t[^>]*>${escapedBeforeText}</w:t>)([\\s\\S]*?)(<w:t[^>]*>)([\\s\\S]{0,100}?)(</w:t>)`,
      'g'
    );

    // 找到所有匹配
    const allMatches: Array<{
      fullMatch: string;
      beforeTag: string;
      middle: string;
      openTag: string;
      textContent: string;
      closeTag: string;
      index: number;
    }> = [];

    let matchResult;
    while ((matchResult = pattern.exec(result)) !== null) {
      // 检查中间部分是否太长或包含段落
      if (matchResult[2].length > 300 || matchResult[2].includes('<w:p')) continue;
      
      allMatches.push({
        fullMatch: matchResult[0],
        beforeTag: matchResult[1],
        middle: matchResult[2],
        openTag: matchResult[3],
        textContent: matchResult[4],
        closeTag: matchResult[5],
        index: matchResult.index,
      });
    }

    // 使用第 usageIndex 个匹配
    if (usageIndex < allMatches.length) {
      const targetMatch = allMatches[usageIndex];
      
      // 检查文本内容是否是可替换的（空格、下划线、或短文本）
      const trimmedContent = targetMatch.textContent.trim();
      const isReplaceable = 
        trimmedContent === '' ||
        trimmedContent === '_' ||
        /^[_\s]+$/.test(trimmedContent) ||
        trimmedContent.length < 5; // 短文本也可能是占位符

      if (isReplaceable) {
        const replacement = variableValues && variableValues[variableKey]
          ? variableValues[variableKey]
          : `{{${variable.name}}}`;

        // 替换这个特定位置
        const newContent = `${targetMatch.beforeTag}${targetMatch.middle}${targetMatch.openTag}${replacement}${targetMatch.closeTag}`;
        result = result.slice(0, targetMatch.index) + newContent + result.slice(targetMatch.index + targetMatch.fullMatch.length);
        
        totalReplaced++;
        console.log(`替换变量 #${usageIndex + 1}: ${variableKey} -> {{${variable.name}}}`);
      } else {
        console.log(`跳过 #${usageIndex + 1}: "${trimmedContent}" 不像占位符`);
      }
    } else {
      console.log(`未找到第 ${usageIndex + 1} 个匹配: ${beforeText}`);
    }
  }

  console.log(`总共替换了 ${totalReplaced} 处变量标记`);
  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/contract-templates/export-word
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

    const sourceFileUrl = (template as any).source_file_url;
    if (!sourceFileUrl) {
      return NextResponse.json({ success: false, error: '模板没有关联的源文件' }, { status: 400 });
    }

    const fileResponse = await fetch(sourceFileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json({ success: false, error: '下载源文件失败' }, { status: 500 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const draftData = (template as any).draft_data as DraftData | null;

    if (draftData && draftData.markers?.length > 0) {
      console.log('开始处理 Word 文档变量替换...');

      try {
        const tmpDir = join('/tmp', `word-export-${Date.now()}`);
        mkdirSync(tmpDir, { recursive: true });
        const inputFile = join(tmpDir, 'input.docx');
        writeFileSync(inputFile, Buffer.from(fileBuffer));

        const zip = new AdmZip(inputFile);
        let documentXmlContent = '';
        let documentXmlPath = '';

        for (const entry of zip.getEntries()) {
          if (entry.entryName === 'word/document.xml') {
            documentXmlContent = entry.getData().toString('utf8');
            documentXmlPath = entry.entryName;
            break;
          }
        }

        if (documentXmlContent) {
          const processedXml = replaceVariablesInXml(documentXmlContent, draftData, variableValues);
          zip.updateFile(documentXmlPath, Buffer.from(processedXml, 'utf8'));
          const outputBuffer = zip.toBuffer();

          console.log('Word 文档变量替换完成');
          rmSync(tmpDir, { recursive: true, force: true });

          return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
            },
          });
        }

        rmSync(tmpDir, { recursive: true, force: true });
      } catch (processError) {
        console.error('处理 Word 文档时出错:', processError);
      }
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name || '合同模板')}.docx"`,
      },
    });
  } catch (error) {
    console.error('导出 Word 失败:', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
