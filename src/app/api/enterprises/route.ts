import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4101';

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

    // 格式化返回数据，包含合同信息
    const enterpriseIds = (data || []).map((item: any) => item.id);
    
    // 获取合同信息
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, enterprise_id, contract_type, contract_number')
      .in('enterprise_id', enterpriseIds);
    
    // 构建合同映射
    const contractMap = new Map((contracts || []).map((c: any) => [c.enterprise_id, c]));
    
    const formattedData = (data || []).map((item: any) => {
      const contract = contractMap.get(item.id);
      return {
        id: item.id,
        name: item.name,
        enterpriseCode: item.enterprise_code,
        creditCode: item.credit_code,
        legalPerson: item.legal_person,
        phone: item.phone,
        adminEmail: item.admin_email,
        adminName: item.admin_name,
        adminPhone: item.admin_phone,
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
        // 合同信息
        contractId: contract?.id || null,
        contractType: contract?.contract_type || null,
        contractNumber: contract?.contract_number || null,
      };
    });

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

    if (!body.base_id) {
      return NextResponse.json(
        { success: false, error: enterpriseType === 'tenant' ? '入驻企业必须选择基地' : '服务企业必须选择主要服务基地' },
        { status: 400 }
      );
    }

    let selectedWorkstation: { id: string; space_id: string; available: boolean; enterprise_id: string | null } | null = null;
    
    if (enterpriseType === 'tenant') {
      // 入驻企业：选择了工位号则待工商注册，否则报错
      if (!body.registration_number_id) {
        return NextResponse.json(
          { success: false, error: '入驻企业必须选择工位号' },
          { status: 400 }
        );
      }

      const { data: workstation, error: workstationError } = await supabase
        .from('registration_numbers')
        .select('id, space_id, available, enterprise_id')
        .eq('id', body.registration_number_id)
        .single();

      if (workstationError || !workstation || workstation.enterprise_id || workstation.available === false) {
        return NextResponse.json(
          { success: false, error: '所选工位已被占用，请重新选择' },
          { status: 409 }
        );
      }

      const { data: workstationSpace, error: workstationSpaceError } = await supabase
        .from('spaces')
        .select('id, meter_id')
        .eq('id', workstation.space_id)
        .single();
      const { data: workstationProperty, error: workstationPropertyError } = workstationSpace?.meter_id
        ? await supabase.from('meters').select('id, base_id').eq('id', workstationSpace.meter_id).single()
        : { data: null, error: new Error('工位缺少物业信息') };

      if (workstationSpaceError || workstationPropertyError || !workstationProperty || workstationProperty.base_id !== body.base_id) {
        return NextResponse.json(
          { success: false, error: '所选工位不属于当前基地' },
          { status: 400 }
        );
      }

      selectedWorkstation = workstation;
      processStatus = 'pending_registration';
    } else {
      // 非入驻企业：创建完成后设为"已建交"状态
      processStatus = 'established'; // 已建交
    }

    // 构建基础企业数据（仅使用数据库已有的字段）
    const enterpriseData: Record<string, any> = {
      id: crypto.randomUUID(),
      name: body.name,
      enterprise_code: finalEnterpriseCode,
      credit_code: body.credit_code || null,
      legal_person: body.legal_person || null,
      phone: body.phone || null,
      admin_email: body.admin_email || null,
      admin_name: body.admin_name || body.legal_person || null,
      admin_phone: body.admin_phone || body.phone || null,
      industry: body.industry || null,
      type: enterpriseType,
      status: body.status || 'active',
      base_id: body.base_id || null,
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
    if (selectedWorkstation?.space_id) enterpriseData.space_id = selectedWorkstation.space_id;

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
        await supabase.from('enterprises').delete().eq('id', enterprise.id);
        return NextResponse.json(
          { success: false, error: '企业创建失败：工位分配未完成，请重试' },
          { status: 500 }
        );
      }
    }

    // 如果有关联合同ID，更新合同的企业关联
    if (body.contract_id) {
      // 先尝试更新 contracts 表
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          enterprise_id: enterprise.id,
          status: 'signed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.contract_id);

      if (contractError) {
        console.error('关联合同失败(contracts):', contractError);
        // 尝试更新 pi_contracts 表
        const { error: piContractError } = await supabase
          .from('pi_contracts')
          .update({
            enterprise_id: enterprise.id,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.contract_id);

        if (piContractError) {
          console.error('关联合同失败(pi_contracts):', piContractError);
        }
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

    let invitation = null;
    let invitationWarning: string | null = null;
    if (body.admin_email && enterprise.organization_id) {
      const cookieToken = request.cookies.get('auth-token')?.value;
      const headerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      const token = cookieToken || headerToken;
      if (token) {
        try {
          const invitationResponse = await fetch(`${BACKEND_URL}/api/access-control/invitations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              organizationId: enterprise.organization_id,
              email: body.admin_email,
              name: body.admin_name || body.legal_person || body.name,
              phone: body.admin_phone || body.phone || null,
              roleCodes: ['enterprise_owner'],
            }),
          });
          const invitationResult = await invitationResponse.json();
          if (invitationResponse.ok && invitationResult.success) {
            invitation = invitationResult.data;
          } else {
            invitationWarning = invitationResult.error || '企业已创建，但负责人邀请生成失败';
          }
        } catch (error) {
          console.error('生成企业负责人邀请失败:', error);
          invitationWarning = '企业已创建，但负责人邀请生成失败';
        }
      } else {
        invitationWarning = '企业已创建，但当前登录状态无法生成负责人邀请';
      }
    }

    return NextResponse.json({
      success: true,
      data: enterprise,
      invitation,
      warning: invitationWarning,
    });
  } catch (error) {
    console.error('创建企业失败:', error);
    return NextResponse.json(
      { success: false, error: '创建企业失败' },
      { status: 500 }
    );
  }
}
