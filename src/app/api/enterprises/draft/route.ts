import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/enterprises/draft
 * 创建或更新企业草稿
 * 
 * 用于在新建企业流程中，完成每个大步骤后保存进度
 * - 完成分配地址后：status='pending_registration' 或 'pending_change'
 * - 未完成分配地址：status='draft'（仅本地暂存）
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
      current_step,
    } = body;

    // 判断是否完成分配地址步骤（有企业名称表示完成）
    const isCompletedAddress = name && name !== `草稿-${enterprise_code}`;
    
    // 根据完成步骤确定状态
    let status = 'draft';
    let processStatus = 'draft';
    
    if (isCompletedAddress) {
      status = 'active'; // 正常状态
      processStatus = type === 'tenant' ? 'pending_registration' : 'pending_change';
    }
    
    // 如果完成了更多步骤，更新流程状态
    if (current_step === 'registration') {
      processStatus = 'pending_contract';
    } else if (current_step === 'contract') {
      processStatus = 'pending_payment';
    }

    // 如果有草稿ID，更新现有记录
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
      
      // 更新状态
      if (isCompletedAddress) {
        updateData.status = status;
        updateData.process_status = processStatus;
      }

      const { data, error } = await supabase
        .from('enterprises')
        .update(updateData)
        .eq('id', draft_id)
        .select()
        .single();

      if (error) {
        console.error('更新草稿失败:', error);
        return NextResponse.json({ success: false, error: '更新草稿失败' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: { id: draft_id, ...data },
        message: '进度已保存',
        isCompleted: isCompletedAddress,
      });
    }

    // 创建新的草稿记录
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

    const enterpriseData: Record<string, any> = {
      id: crypto.randomUUID(),
      name: name || `草稿-${enterprise_code}`,
      enterprise_code,
      type: type || 'tenant',
      status: status, // 根据完成情况设置状态
      process_status: processStatus,
      space_id: space_id || null,
      registered_address: registered_address || null,
      business_address: business_address || null,
      business_scope: business_scope || null,
      credit_code: credit_code || null,
      legal_person: legal_person || null,
      phone: phone || null,
      industry: industry || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enterprises')
      .insert(enterpriseData)
      .select()
      .single();

    if (error) {
      console.error('创建草稿失败:', error);
      return NextResponse.json({ success: false, error: '创建草稿失败' }, { status: 500 });
    }

    // 如果有空间ID，标记为已预留（仅在完成分配地址后）
    if (space_id && isCompletedAddress) {
      await supabase
        .from('spaces')
        .update({
          status: 'reserved',
          enterprise_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', space_id);
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id, ...data },
      message: isCompletedAddress ? '进度已保存' : '草稿已保存',
      isCompleted: isCompletedAddress,
    });
  } catch (error) {
    console.error('保存草稿失败:', error);
    return NextResponse.json({ success: false, error: '保存草稿失败' }, { status: 500 });
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
      // 获取单个草稿
      const { data, error } = await supabase
        .from('enterprises')
        .select('*')
        .eq('id', draftId)
        .eq('status', 'draft')
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: '草稿不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data });
    }

    // 获取所有草稿
    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取草稿列表失败:', error);
      return NextResponse.json({ success: false, error: '获取草稿列表失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('获取草稿失败:', error);
    return NextResponse.json({ success: false, error: '获取草稿失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/enterprises/draft
 * 删除草稿
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ success: false, error: '请提供草稿ID' }, { status: 400 });
    }

    // 获取草稿信息，释放关联资源
    const { data: draft } = await supabase
      .from('enterprises')
      .select('space_id')
      .eq('id', draftId)
      .single();

    // 释放空间
    if (draft?.space_id) {
      await supabase
        .from('spaces')
        .update({
          status: 'available',
          enterprise_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draft.space_id);
    }

    // 释放关联的工位号
    await supabase
      .from('registration_numbers')
      .update({
        available: true,
        enterprise_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('enterprise_id', draftId);

    // 删除草稿
    const { error } = await supabase
      .from('enterprises')
      .delete()
      .eq('id', draftId);

    if (error) {
      console.error('删除草稿失败:', error);
      return NextResponse.json({ success: false, error: '删除草稿失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '草稿已删除' });
  } catch (error) {
    console.error('删除草稿失败:', error);
    return NextResponse.json({ success: false, error: '删除草稿失败' }, { status: 500 });
  }
}
