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
    const unassigned = searchParams.get('unassigned');

    // 如果请求未分配工位号的企业
    if (unassigned === 'true') {
      // 获取已分配工位号的企业ID
      const { data: assignedRegNumbers } = await supabase
        .from('registration_numbers')
        .select('enterprise_id')
        .not('enterprise_id', 'is', null);
      
      const assignedEnterpriseIds = new Set(
        (assignedRegNumbers || []).map(r => r.enterprise_id)
      );

      // 获取所有入驻企业
      const { data: allEnterprises, error: entError } = await supabase
        .from('enterprises')
        .select('id, name, legal_person')
        .eq('type', 'tenant');

      if (entError) {
        return NextResponse.json(
          { success: false, error: '获取企业失败' },
          { status: 500 }
        );
      }

      // 过滤出未分配的企业
      const unassignedEnterprises = (allEnterprises || [])
        .filter(e => !assignedEnterpriseIds.has(e.id))
        .map(e => ({
          id: e.id,
          name: e.name,
          legalPerson: e.legal_person
        }));

      return NextResponse.json({
        success: true,
        data: unassignedEnterprises,
      });
    }

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
      proofDocumentUrl: item.proof_document_url,
      registrationNumber: item.registration_number,
      baseId: item.base_id,
      spaceId: item.space_id,
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
 * 
 * 新流程：
 * 1. 选择基地
 * 2. 选择类型（入驻/非入驻）
 * 3. 选择工位号
 * 4. 上传产权证明
 * 5. 确认企业名称
 * 
 * 入驻企业状态：pending_registration（待工商注册）
 * 非入驻企业状态：pending_change（待工商变更）
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

    // 检查企业编号是否已存在，如果存在则生成新的
    let finalEnterpriseCode = body.enterprise_code;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingEnterprise } = await supabase
        .from('enterprises')
        .select('id, name')
        .eq('enterprise_code', finalEnterpriseCode)
        .single();

      if (!existingEnterprise) {
        break; // 编号可用
      }

      // 生成新编号
      const prefix = (body.type || 'tenant') === 'non_tenant' ? 'NQ' : 'RQ';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalEnterpriseCode = `${prefix}-${timestamp}${random}`;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: '无法生成唯一的企业编号，请稍后重试' },
        { status: 500 }
      );
    }

    // 检查企业名称是否已存在（排除已终止的企业）
    const { data: existingName } = await supabase
      .from('enterprises')
      .select('id, name, process_status')
      .eq('name', body.name)
      .neq('process_status', 'terminated')
      .single();

    if (existingName) {
      return NextResponse.json(
        { success: false, error: `企业名称「${body.name}」已存在，请检查是否重复录入` },
        { status: 400 }
      );
    }

    // 根据类型确定流程状态
    let processStatus = 'new';
    const enterpriseType = body.type || 'tenant';
    
    if (enterpriseType === 'tenant') {
      // 入驻企业：选择了工位号则待工商注册，否则报错
      if (body.registration_number_id || body.space_id) {
        processStatus = 'pending_registration'; // 有工位号，待工商注册
      } else {
        return NextResponse.json(
          { success: false, error: '入驻企业必须选择工位号' },
          { status: 400 }
        );
      }
    } else {
      // 非入驻企业
      processStatus = 'pending_change'; // 待工商变更
    }

    // 构建基础企业数据（仅使用数据库已有的字段）
    const enterpriseData: Record<string, any> = {
      id: crypto.randomUUID(),
      name: body.name,
      enterprise_code: finalEnterpriseCode,
      credit_code: body.credit_code || null,
      legal_person: body.legal_person || null,
      phone: body.phone || null,
      industry: body.industry || null,
      type: enterpriseType,
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

    // 添加空间ID（数据库已有此字段）
    if (body.space_id) enterpriseData.space_id = body.space_id;

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
        { success: false, error: `创建企业失败: ${enterpriseError.message}` },
        { status: 500 }
      );
    }

    // 如果选择了工位号，标记为已使用
    if (body.registration_number_id) {
      const { error: updateRegError } = await supabase
        .from('registration_numbers')
        .update({
          available: false,
          enterprise_id: enterprise.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.registration_number_id);

      if (updateRegError) {
        console.error('更新工位号状态失败:', updateRegError);
      }
    }

    // 如果是入驻企业且有房间信息，创建房间关联
    if (enterpriseType === 'tenant' && body.space_id) {
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
      }
    }

    // 如果有关联合同ID，更新合同的企业关联
    if (body.contract_id) {
      const { error: contractError } = await supabase
        .from('pi_contracts')
        .update({
          enterprise_id: enterprise.id,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.contract_id);

      if (contractError) {
        console.error('关联合同失败:', contractError);
      }
    }

    // 如果有费用信息，创建费用记录
    if (body.fees && body.fees.length > 0) {
      const paymentRecords = body.fees.map((fee: any) => ({
        id: crypto.randomUUID(),
        enterprise_id: enterprise.id,
        payment_type: 'settlement', // 结算类费用
        payment_name: fee.name,
        amount: fee.amount,
        paid_amount: fee.amount, // 已缴金额等于应付金额
        payment_method: fee.payment_method || 'bank_transfer',
        payment_date: fee.payment_date,
        payment_voucher: fee.proof_url,
        status: fee.status || 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: paymentsError } = await supabase
        .from('pi_settlement_payments')
        .insert(paymentRecords);

      if (paymentsError) {
        console.error('创建费用记录失败:', paymentsError);
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
