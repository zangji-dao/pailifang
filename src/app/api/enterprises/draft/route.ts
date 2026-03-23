import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/enterprises/draft
 * 创建或更新企业草稿
 * 
 * 用于在新建企业流程中，完成每个大步骤后保存进度
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      draft_id, // 如果有草稿ID则更新，否则创建新的
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
      current_step, // 当前完成到哪一步
    } = body;

    // 如果有草稿ID，更新现有记录
    if (draft_id) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // 只更新提供的字段（仅使用数据库已有的字段）
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

      // 根据当前步骤更新流程状态
      if (current_step) {
        if (current_step === 'address') {
          updateData.process_status = type === 'tenant' ? 'pending_registration' : 'pending_change';
        } else if (current_step === 'registration') {
          updateData.process_status = 'registered';
        } else if (current_step === 'contract') {
          updateData.process_status = 'contracted';
        }
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
        message: '草稿已更新',
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
      status: 'draft', // 草稿状态
      process_status: 'draft',
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

    // 如果有空间ID，标记为已预留
    if (space_id) {
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
      message: '草稿已保存',
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
