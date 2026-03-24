import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/enterprises/draft
 * 创建或更新企业草稿
 * 
 * 业务逻辑：
 * - 完成分配地址步骤后：创建/更新企业记录，状态设为 pending_registration
 * - 空间关联到企业，状态改为 reserved
 * - 工位号标记为已使用
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      draft_id,
      name,
      enterprise_code,
      type,
      space_id,
      registered_address,
      business_address,
      business_scope,
      credit_code,
      legal_person,
      phone,
      industry,
      registered_capital,
      establish_date,
      current_step,
      registration_number_id,  // 工位号记录ID
      registration_number,     // 工位号
    } = body;

    // 判断是否完成分配地址步骤（有企业类型和编号表示至少完成了类型选择）
    // 当用户点击"下一步"从分配地址进入工商注册时，应该创建企业记录
    const hasBasicInfo = enterprise_code && type;
    
    // 根据当前步骤确定状态
    let status = 'draft';
    let processStatus = 'draft';
    
    if (hasBasicInfo && current_step === 'address') {
      // 完成分配地址步骤，进入工商注册
      status = 'active';
      processStatus = type === 'tenant' ? 'pending_registration' : 'pending_change';
    } else if (current_step === 'registration') {
      status = 'active';
      processStatus = 'pending_contract';
    } else if (current_step === 'contract') {
      status = 'active';
      processStatus = 'pending_payment';
    }

    // 如果有草稿ID，尝试更新现有记录
    if (draft_id) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (space_id !== undefined) updateData.space_id = space_id;
      if (registered_address !== undefined) updateData.registered_address = registered_address;
      if (business_address !== undefined) updateData.business_address = business_address;
      if (business_scope !== undefined) updateData.business_scope = business_scope;
      if (credit_code !== undefined) updateData.credit_code = credit_code;
      if (legal_person !== undefined) updateData.legal_person = legal_person;
      if (phone !== undefined) updateData.phone = phone;
      if (industry !== undefined) updateData.industry = industry;
      if (registered_capital !== undefined) updateData.registered_capital = registered_capital;
      if (establish_date !== undefined) updateData.establish_date = establish_date;
      
      // 更新状态
      if (status !== 'draft') {
        updateData.status = status;
        updateData.process_status = processStatus;
      }

      // 如果有工位号，也更新
      if (registration_number !== undefined) {
        updateData.registration_number = registration_number;
      }

      const { data, error } = await supabase
        .from('enterprises')
        .update(updateData)
        .eq('id', draft_id)
        .select()
        .single();

      // 如果记录不存在，清除 draft_id 让后面创建新记录
      if (error?.code === 'PGRST116') {
        console.log('草稿记录不存在，将创建新记录');
        // 继续执行创建逻辑
      } else if (error) {
        console.error('更新草稿失败:', error);
        return NextResponse.json({ success: false, error: '更新草稿失败' }, { status: 500 });
      } else {
        // 更新成功，同时更新空间和工位号关联
        await updateRelatedResources(supabase, draft_id, space_id, registration_number_id, status !== 'draft');
        
        return NextResponse.json({
          success: true,
          data: { id: draft_id, ...data },
          message: '进度已保存',
          processStatus,
        });
      }
    }

    // 创建新的企业记录
    if (!enterprise_code) {
      return NextResponse.json(
        { success: false, error: '企业编号为必填项' },
        { status: 400 }
      );
    }

    // 检查企业编号是否已存在
    const { data: existingEnterprise } = await supabase
      .from('enterprises')
      .select('id')
      .eq('enterprise_code', enterprise_code)
      .single();

    if (existingEnterprise) {
      return NextResponse.json(
        { success: false, error: '企业编号已存在' },
        { status: 400 }
      );
    }

    const newId = crypto.randomUUID();
    const enterpriseData: Record<string, any> = {
      id: newId,
      name: name || `草稿-${enterprise_code}`,
      enterprise_code,
      type: type || 'tenant',
      status: status,
      process_status: processStatus,
      space_id: space_id || null,
      registered_address: registered_address || null,
      business_address: business_address || null,
      business_scope: business_scope || null,
      credit_code: credit_code || null,
      legal_person: legal_person || null,
      phone: phone || null,
      industry: industry || null,
      registered_capital: registered_capital || null,
      establish_date: establish_date || null,
      registration_number: registration_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enterprises')
      .insert(enterpriseData)
      .select()
      .single();

    if (error) {
      console.error('创建企业记录失败:', error);
      return NextResponse.json({ success: false, error: '创建企业记录失败' }, { status: 500 });
    }

    // 更新关联资源（空间和工位号）
    await updateRelatedResources(supabase, newId, space_id, registration_number_id, status !== 'draft');

    return NextResponse.json({
      success: true,
      data: { id: newId, ...data },
      message: status !== 'draft' ? '进度已保存，可继续工商注册' : '草稿已保存',
      processStatus,
    });
  } catch (error) {
    console.error('保存失败:', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}

/**
 * 更新关联资源（空间和工位号）
 */
async function updateRelatedResources(
  supabase: any,
  enterpriseId: string,
  spaceId: string | null,
  registrationNumberId: string | null,
  isActive: boolean
) {
  // 更新空间状态和关联
  if (spaceId) {
    await supabase
      .from('spaces')
      .update({
        status: isActive ? 'reserved' : 'available',
        enterprise_id: isActive ? enterpriseId : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spaceId);
  }

  // 更新工位号状态
  if (registrationNumberId) {
    await supabase
      .from('registration_numbers')
      .update({
        available: !isActive,
        enterprise_id: isActive ? enterpriseId : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationNumberId);
  }
}

/**
 * GET /api/enterprises/draft
 * 获取草稿列表或单个草稿
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (draftId) {
      // 获取单个企业（不限制状态，支持继续注册）
      const { data, error } = await supabase
        .from('enterprises')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: '企业不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data });
    }

    // 获取待处理的企业列表（待注册、待签约、待缴费）
    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .in('process_status', ['draft', 'pending_registration', 'pending_change', 'pending_contract', 'pending_payment'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取企业列表失败:', error);
      return NextResponse.json({ success: false, error: '获取企业列表失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('获取企业失败:', error);
    return NextResponse.json({ success: false, error: '获取企业失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/enterprises/draft
 * 删除草稿/取消注册
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ success: false, error: '请提供企业ID' }, { status: 400 });
    }

    // 获取企业信息，释放关联资源
    const { data: enterprise } = await supabase
      .from('enterprises')
      .select('space_id, registration_number')
      .eq('id', draftId)
      .single();

    // 释放空间
    if (enterprise?.space_id) {
      await supabase
        .from('spaces')
        .update({
          status: 'available',
          enterprise_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enterprise.space_id);
    }

    // 释放关联的工位号
    if (enterprise?.registration_number) {
      await supabase
        .from('registration_numbers')
        .update({
          available: true,
          enterprise_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('enterprise_id', draftId);
    }

    // 删除企业记录
    const { error } = await supabase
      .from('enterprises')
      .delete()
      .eq('id', draftId);

    if (error) {
      console.error('删除企业失败:', error);
      return NextResponse.json({ success: false, error: '删除企业失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '企业已删除' });
  } catch (error) {
    console.error('删除企业失败:', error);
    return NextResponse.json({ success: false, error: '删除企业失败' }, { status: 500 });
  }
}
