import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/registration-numbers/[id]/authorization-letter
 * 生成房屋产权证明授权函
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 1. 获取注册号基本信息
    const { data: regNumber, error: regError } = await supabase
      .from('registration_numbers')
      .select('id, code, manual_code, property_owner, management_company, created_at, space_id')
      .eq('id', id)
      .single();

    if (regError || !regNumber) {
      console.error('获取注册号失败:', regError);
      return NextResponse.json({ success: false, error: '注册号不存在' }, { status: 404 });
    }

    // 2. 获取空间信息
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, code, name, meter_id')
      .eq('id', regNumber.space_id)
      .single();

    // 3. 获取物业信息
    let meter = null;
    let base = null;
    
    if (space?.meter_id) {
      const { data: meterData } = await supabase
        .from('meters')
        .select('id, code, name, base_id')
        .eq('id', space.meter_id)
        .single();
      meter = meterData;

      // 4. 获取基地信息
      if (meter?.base_id) {
        const { data: baseData } = await supabase
          .from('bases')
          .select('id, name, address')
          .eq('id', meter.base_id)
          .single();
        base = baseData;
      }
    }

    // 解析地址（从基地地址中提取市和区）
    const baseAddress = base?.address || '';
    let city = '';
    let district = '';
    
    // 解析市：匹配"XX市"或"XX省XX市"
    const cityMatch = baseAddress.match(/省?(.+?市)/);
    if (cityMatch) {
      city = cityMatch[1].replace('市', '');
    }
    
    // 解析区：匹配"XX区"
    const districtMatch = baseAddress.match(/市(.+?区)/);
    if (districtMatch) {
      district = districtMatch[1].replace('区', '');
    }

    // 构建详细地址：基地地址 + 物业名称 + 空间名称
    const meterPart = meter?.name || meter?.code || '';
    const spacePart = space?.name || space?.code || '';
    const detailAddress = `${baseAddress} ${meterPart} ${spacePart}`.trim();

    // 显示编号（优先人工编号）
    const displayCode = regNumber.manual_code || regNumber.code;

    // 格式化日期
    const date = new Date(regNumber.created_at);
    const formattedDate = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;

    // 生成HTML内容
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>房屋产权证明</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 16px;
      line-height: 2;
      padding: 60px 80px;
      background: #fff;
    }
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 40px;
      letter-spacing: 8px;
    }
    .content {
      text-indent: 2em;
      text-align: justify;
    }
    .blank {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 60px;
      text-align: center;
      margin: 0 2px;
    }
    .footer {
      margin-top: 60px;
      text-align: right;
      padding-right: 40px;
    }
    .seal-area {
      margin-top: 20px;
      text-align: right;
      padding-right: 40px;
    }
    .seal-label {
      font-size: 14px;
      color: #666;
    }
    @media print {
      body { padding: 40px 60px; }
    }
  </style>
</head>
<body>
  <div class="title">房屋产权证明</div>
  <div class="content">
    <p>兹证明，位于<span class="blank">${city}</span>市 <span class="blank">${district}</span>区${detailAddress}的房屋，其所有权属于<span class="blank">${regNumber.property_owner || '__________'}</span>，管理权归<span class="blank">${regNumber.management_company || '__________'}</span>所有，现已将该房屋无偿租赁给<span class="blank">${displayCode}</span>作为经营场所使用，该房屋无单独房照，符合国家安全标准，不属于拆迁范围。</p>
    <p style="margin-top: 20px;">特此证明。</p>
  </div>
  <div class="footer">
    <p>${formattedDate}</p>
  </div>
  <div class="seal-area">
    <p class="seal-label">出证单位盖章</p>
  </div>
</body>
</html>
    `;

    // 返回HTML内容（前端可以用新窗口打开或打印）
    return NextResponse.json({
      success: true,
      data: {
        html,
        url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      },
    });
  } catch (error) {
    console.error('生成授权函失败:', error);
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
}
