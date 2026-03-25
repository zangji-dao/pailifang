import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 将 snake_case 转换为 camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        item && typeof item === 'object' ? toCamelCase(item as Record<string, unknown>) : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * GET /api/bases/[id]
 * 获取单个基地详情（包含管理公司信息）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    // 获取基地基本信息
    const { data: base, error: baseError } = await supabase
      .from('bases')
      .select(`
        id,
        name,
        address,
        status,
        created_at,
        updated_at,
        management_company_name,
        management_company_credit_code,
        management_company_legal_person,
        management_company_address,
        management_company_phone
      `)
      .eq('id', id)
      .single();

    if (baseError) {
      console.error('获取基地失败:', baseError);
      return NextResponse.json({ success: false, error: '获取基地失败' }, { status: 500 });
    }

    if (!base) {
      return NextResponse.json({ success: false, error: '基地不存在' }, { status: 404 });
    }

    // 获取关联的物业
    const { data: meters, error: metersError } = await supabase
      .from('meters')
      .select(`
        id,
        code,
        name,
        area,
        status,
        base_id,
        sort_order,
        electricity_number,
        electricity_type,
        electricity_balance,
        electricity_balance_updated_at,
        electricity_enterprise_id,
        water_number,
        water_type,
        water_balance,
        water_balance_updated_at,
        water_enterprise_id,
        heating_number,
        heating_type,
        heating_status,
        heating_enterprise_id,
        network_number,
        network_type,
        network_status,
        enterprise_id,
        created_at,
        updated_at,
        spaces (
          id,
          code,
          name,
          area,
          status,
          meter_id,
          enterprise_id,
          created_at,
          updated_at
        )
      `)
      .eq('base_id', id)
      .order('sort_order');

    if (metersError) {
      console.error('获取物业失败:', metersError);
    }

    // 获取所有空间的 ID
    const spaceIds = meters?.flatMap(m => m.spaces?.map(s => s.id) || []) || [];
    
    // 单独查询工位号（registration_numbers）- 不包含 enterprise 关联
    const { data: regNumbers, error: regError } = await supabase
      .from('registration_numbers')
      .select(`
        id,
        code,
        manual_code,
        space_id,
        enterprise_id,
        available,
        property_owner,
        management_company,
        assigned_enterprise_name,
        created_at,
        updated_at
      `)
      .in('space_id', spaceIds);

    if (regError) {
      console.error('获取工位号失败:', regError);
    }

    // 获取所有工位号关联的企业ID
    const enterpriseIds = regNumbers?.map(r => r.enterprise_id).filter(Boolean) || [];
    
    // 查询企业信息
    const { data: enterprises, error: entError } = await supabase
      .from('enterprises')
      .select('id, name')
      .in('id', enterpriseIds);
    
    if (entError) {
      console.error('获取企业信息失败:', entError);
    }
    
    // 创建企业ID到企业信息的映射
    const enterpriseMap: Record<string, { id: string; name: string }> = {};
    enterprises?.forEach(ent => {
      enterpriseMap[ent.id] = ent;
    });
    
    // 将企业信息添加到工位号
    const regNumbersWithEnterprise = regNumbers?.map(reg => ({
      ...reg,
      enterprise: reg.enterprise_id ? enterpriseMap[reg.enterprise_id] || null : null
    })) || [];

    // 组装数据：将工位号按 space_id 分组
    const regNumbersBySpaceId: Record<string, typeof regNumbersWithEnterprise> = {};
    regNumbersWithEnterprise?.forEach(reg => {
      if (!regNumbersBySpaceId[reg.space_id]) {
        regNumbersBySpaceId[reg.space_id] = [];
      }
      regNumbersBySpaceId[reg.space_id].push(reg);
    });

    // 将工位号添加到对应的空间
    const metersWithRegNumbers = meters?.map(meter => ({
      ...meter,
      spaces: meter.spaces?.map(space => ({
        ...space,
        regNumbers: regNumbersBySpaceId[space.id] || []
      })) || []
    })) || [];

    // 转换字段名为 camelCase
    const camelBase = toCamelCase(base);
    const camelMeters = metersWithRegNumbers.map(m => toCamelCase(m));

    return NextResponse.json({
      success: true,
      data: {
        ...camelBase,
        meters: camelMeters,
      },
    });
  } catch (error) {
    console.error('获取基地详情失败:', error);
    return NextResponse.json({ success: false, error: '获取基地详情失败' }, { status: 500 });
  }
}

/**
 * PUT /api/bases/[id]
 * 更新基地信息（包含管理公司信息）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 基本信息字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.status !== undefined) updateData.status = body.status;

    // 管理公司字段
    if (body.management_company_name !== undefined) updateData.management_company_name = body.management_company_name;
    if (body.management_company_credit_code !== undefined) updateData.management_company_credit_code = body.management_company_credit_code;
    if (body.management_company_legal_person !== undefined) updateData.management_company_legal_person = body.management_company_legal_person;
    if (body.management_company_address !== undefined) updateData.management_company_address = body.management_company_address;
    if (body.management_company_phone !== undefined) updateData.management_company_phone = body.management_company_phone;

    const { data, error } = await supabase
      .from('bases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新基地失败:', error);
      return NextResponse.json({ success: false, error: '更新基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新基地失败:', error);
    return NextResponse.json({ success: false, error: '更新基地失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/bases/[id]
 * 删除基地
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('bases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除基地失败:', error);
      return NextResponse.json({ success: false, error: '删除基地失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除基地失败:', error);
    return NextResponse.json({ success: false, error: '删除基地失败' }, { status: 500 });
  }
}
