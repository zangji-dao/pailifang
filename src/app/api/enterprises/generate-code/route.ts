import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/enterprises/generate-code
 * 生成企业编号
 * 
 * 规则：
 * - 入驻企业：RQ-YYYYMMDD-XXX（R=入驻，Q=企业）
 * - 非入驻企业：NQ-YYYYMMDD-XXX（N=非，Q=企业）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { type } = body as { type: 'tenant' | 'non_tenant' };

    if (!type || !['tenant', 'non_tenant'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '请提供有效的企业类型' },
        { status: 400 }
      );
    }

    // 生成前缀和日期部分
    const prefix = type === 'tenant' ? 'RQ' : 'NQ';
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    // 查询当天已生成的编号数量
    const { data: existingCodes, error } = await supabase
      .from('enterprises')
      .select('enterprise_code')
      .like('enterprise_code', `${prefix}-${dateStr}-%`)
      .order('enterprise_code', { ascending: false })
      .limit(1);

    if (error) {
      console.error('查询企业编号失败:', error);
      // 如果查询失败，使用时间戳作为序号
      const timestamp = Date.now().toString().slice(-6);
      return NextResponse.json({
        success: true,
        data: { code: `${prefix}-${dateStr}-${timestamp}` },
      });
    }

    // 计算下一个序号
    let sequence = 1;
    if (existingCodes && existingCodes.length > 0) {
      const lastCode = existingCodes[0].enterprise_code;
      if (lastCode) {
        const lastSequence = parseInt(lastCode.split('-')[2], 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    // 生成完整编号
    const code = `${prefix}-${dateStr}-${String(sequence).padStart(3, '0')}`;

    return NextResponse.json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('生成企业编号失败:', error);
    return NextResponse.json(
      { success: false, error: '生成企业编号失败' },
      { status: 500 }
    );
  }
}
