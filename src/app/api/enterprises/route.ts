import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/enterprises
 * 获取企业列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // 可选过滤参数
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const processStatus = searchParams.get('process_status');
    const keyword = searchParams.get('keyword');

    let query = supabase
      .from('enterprises')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用过滤
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (processStatus) {
      query = query.eq('process_status', processStatus);
    }
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,enterprise_code.ilike.%${keyword}%,legal_person.ilike.%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取企业列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取企业列表失败' },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      enterpriseCode: item.enterprise_code,
      creditCode: item.credit_code,
      legalPerson: item.legal_person,
      phone: item.phone,
      industry: item.industry,
      type: item.type,
      status: item.status,
      processStatus: item.process_status,
      registeredAddress: item.registered_address,
      businessAddress: item.business_address,
      businessScope: item.business_scope,
      settledDate: item.settled_date,
      remarks: item.remarks,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('获取企业列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取企业列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprises
 * 创建企业
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: '企业名称为必填项' },
        { status: 400 }
      );
    }

    if (!body.enterprise_code) {
      return NextResponse.json(
        { success: false, error: '企业编号为必填项' },
        { status: 400 }
      );
    }

    // 检查企业编号是否已存在
    const { data: existingEnterprise } = await supabase
      .from('enterprises')
      .select('id')
      .eq('enterprise_code', body.enterprise_code)
      .single();

    if (existingEnterprise) {
      return NextResponse.json(
        { success: false, error: '企业编号已存在' },
        { status: 400 }
      );
    }

    // 确定流程状态
    let processStatus = 'new';
    if (body.type === 'tenant') {
      // 入驻企业流程
      if (body.space_id || body.registered_address) {
        processStatus = 'pending_business'; // 已分配地址，进入待工商注册
      } else {
        processStatus = 'pending_address'; // 待分配地址
      }
    } else {
      // 非入驻企业，直接设为新建状态
      processStatus = 'new';
    }

    const enterpriseData = {
      id: crypto.randomUUID(),
      name: body.name,
      enterprise_code: body.enterprise_code,
      credit_code: body.credit_code || null,
      legal_person: body.legal_person || null,
      phone: body.phone || null,
      industry: body.industry || null,
      type: body.type || 'tenant',
      status: body.status || 'active',
      process_status: processStatus,
      business_scope: body.business_scope || null,
      registered_address: body.registered_address || null,
      business_address: body.business_address || null,
      settled_date: body.settled_date || new Date().toISOString().split('T')[0],
      remarks: body.remarks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[创建企业] 准备插入的数据:', JSON.stringify(enterpriseData, null, 2));

    const insertResult = await supabase
      .from('enterprises')
      .insert(enterpriseData)
      .select();

    const enterprise = insertResult.data?.[0];
    const enterpriseError = insertResult.error;

    console.log('[创建企业] 插入结果:', JSON.stringify({ enterprise, error: enterpriseError }, null, 2));

    if (enterpriseError) {
      console.error('创建企业失败:', enterpriseError);
      return NextResponse.json(
        { success: false, error: '创建企业失败' },
        { status: 500 }
      );
    }

    // 如果是入驻企业且有房间信息，创建房间关联
    if (body.type === 'tenant' && body.space_id) {
      // 分配房间给企业
      const { error: updateSpaceError } = await supabase
        .from('spaces')
        .update({ 
          status: 'occupied',
          enterprise_id: enterprise.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.space_id);

      if (updateSpaceError) {
        console.error('分配房间失败:', updateSpaceError);
        // 不影响主流程，仅记录错误
      }

      // 分配工位号
      const { data: regNumbers } = await supabase
        .from('registration_numbers')
        .select('id, code')
        .eq('space_id', body.space_id)
        .eq('available', true)
        .limit(1);

      if (regNumbers && regNumbers.length > 0) {
        const regNumber = regNumbers[0];
        
        // 标记工位号为已使用
        await supabase
          .from('registration_numbers')
          .update({ 
            available: false,
            enterprise_id: enterprise.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', regNumber.id);
      }
    }

    // 如果有合同信息，创建合同记录
    if (body.contract) {
      const contractData = {
        id: crypto.randomUUID(),
        enterprise_id: enterprise.id,
        contract_number: body.contract.contract_number,
        contract_type: 'lease',
        start_date: body.contract.start_date,
        end_date: body.contract.end_date,
        amount: body.contract.monthly_rent || 0,
        deposit: body.contract.deposit || 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: contractError } = await supabase
        .from('contracts')
        .insert(contractData);

      if (contractError) {
        console.error('创建合同失败:', contractError);
      }
    }

    // 如果有费用信息，创建费用记录
    if (body.fees && body.fees.length > 0) {
      const feeRecords = body.fees.map((fee: any) => ({
        id: crypto.randomUUID(),
        enterprise_id: enterprise.id,
        fee_type: fee.name,
        amount: fee.amount,
        payment_method: fee.payment_method,
        payment_date: fee.payment_date,
        status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: feesError } = await supabase
        .from('fees')
        .insert(feeRecords);

      if (feesError) {
        console.error('创建费用记录失败:', feesError);
      }
    }

    return NextResponse.json({
      success: true,
      data: enterprise,
    });
  } catch (error) {
    console.error('创建企业失败:', error);
    return NextResponse.json(
      { success: false, error: '创建企业失败' },
      { status: 500 }
    );
  }
}
