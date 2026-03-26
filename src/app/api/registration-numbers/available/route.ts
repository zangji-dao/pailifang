import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/registration-numbers/available
 * 获取可用的工位号列表（未正式分配给企业的工位号）
 * 支持参数：
 * - base_id: 按基地ID过滤
 * - search: 按企业名称搜索
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const baseId = searchParams.get('base_id');
    const search = searchParams.get('search');

    // 1. 查询所有未正式分配的工位号（enterprise_id 为空）
    // 无论是 available=true 还是 false，只要没有 enterprise_id 就可以选择
    let query = supabase
      .from('registration_numbers')
      .select('id, code, manual_code, available, space_id, assigned_enterprise_name, property_owner, management_company, created_at')
      .is('enterprise_id', null)  // 未正式分配给企业
      .order('code', { ascending: true });

    const { data: regNumbers, error: regError } = await query;

    if (regError) {
      console.error('获取可用工位号失败:', regError);
      return NextResponse.json({ success: false, error: '获取可用工位号失败' }, { status: 500 });
    }

    if (!regNumbers || regNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 2. 获取所有空间ID
    const spaceIds = regNumbers.map(r => r.space_id).filter(Boolean);

    // 3. 查询空间信息
    const { data: spaces, error: spaceError } = await supabase
      .from('spaces')
      .select('id, code, name, area, meter_id')
      .in('id', spaceIds);

    if (spaceError) {
      console.error('获取空间信息失败:', spaceError);
    }

    // 4. 获取所有物业ID
    const meterIds = (spaces || []).map(s => s.meter_id).filter(Boolean);

    // 5. 查询物业信息
    const { data: meters, error: meterError } = await supabase
      .from('meters')
      .select('id, code, name, base_id')
      .in('id', meterIds);

    if (meterError) {
      console.error('获取物业信息失败:', meterError);
    }

    // 6. 获取所有基地ID
    const baseIds = (meters || []).map(m => m.base_id).filter(Boolean);

    // 7. 查询基地信息
    const { data: bases, error: baseError } = await supabase
      .from('bases')
      .select('id, name, address, address_template')
      .in('id', baseIds);

    if (baseError) {
      console.error('获取基地信息失败:', baseError);
    }

    // 8. 组装数据
    let formattedData = regNumbers.map((reg) => {
      const space = (spaces || []).find(s => s.id === reg.space_id);
      const meter = space ? (meters || []).find(m => m.id === space.meter_id) : null;
      const base = meter ? (bases || []).find(b => b.id === meter.base_id) : null;

      // 地址格式：松原市宁江区建华路义乌城小区1号楼XXX号
      const displayCode = reg.manual_code || reg.code;
      const fullAddress = base?.address 
        ? `${base.address}${displayCode}号`
        : null;

      return {
        id: reg.id,
        code: reg.code,
        manualCode: reg.manual_code,
        displayCode: displayCode, // 优先使用人工编号
        spaceId: reg.space_id,
        spaceName: space?.name || space?.code || '',
        spaceCode: space?.code || '',
        meterName: meter?.name || meter?.code || '',
        meterCode: meter?.code || '',
        baseId: base?.id || '',
        baseName: base?.name || '',
        baseAddress: base?.address || null,
        fullAddress,
        assignedEnterpriseName: reg.assigned_enterprise_name,
        propertyOwner: reg.property_owner,
        managementCompany: reg.management_company,
      };
    });

    // 如果指定了基地ID，过滤结果
    if (baseId) {
      formattedData = formattedData.filter(item => item.baseId === baseId);
    }

    // 如果指定了搜索关键词，按企业名称过滤
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      formattedData = formattedData.filter(item => 
        item.assignedEnterpriseName?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('获取可用工位号失败:', error);
    return NextResponse.json({ success: false, error: '获取可用工位号失败' }, { status: 500 });
  }
}
