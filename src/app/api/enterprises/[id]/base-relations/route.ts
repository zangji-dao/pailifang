import { createClient } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: enterprise, error: enterpriseError } = await supabase
      .from('enterprises')
      .select('id, base_id, type')
      .eq('id', id)
      .single();

    if (enterpriseError || !enterprise) {
      return NextResponse.json({ success: false, error: '企业不存在' }, { status: 404 });
    }

    const { data: relations, error: relationError } = await supabase
      .from('enterprise_base_relations')
      .select('id, base_id, relation_type, status, source, started_at, ended_at')
      .eq('enterprise_id', id)
      .eq('status', 'active')
      .order('started_at', { ascending: true });

    if (relationError) {
      console.error('获取企业基地关系失败:', relationError);
      return NextResponse.json({ success: false, error: '获取基地关系失败' }, { status: 500 });
    }

    const baseIds = (relations || []).map(relation => relation.base_id);
    const { data: bases, error: baseError } = baseIds.length > 0
      ? await supabase.from('bases').select('id, name, address, status').in('id', baseIds)
      : { data: [], error: null };

    if (baseError) {
      console.error('获取关系基地信息失败:', baseError);
    }

    const baseMap = new Map((bases || []).map(base => [base.id, base]));
    const result = (relations || []).map(relation => ({
      id: relation.id,
      baseId: relation.base_id,
      relationType: relation.relation_type,
      status: relation.status,
      source: relation.source,
      startedAt: relation.started_at,
      isPrimary: enterprise.base_id === relation.base_id,
      base: baseMap.get(relation.base_id) || null,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('获取企业基地关系失败:', error);
    return NextResponse.json({ success: false, error: '获取基地关系失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const baseId = typeof body.base_id === 'string' ? body.base_id : '';

    if (!baseId) {
      return NextResponse.json({ success: false, error: '请选择服务基地' }, { status: 400 });
    }

    const [{ data: enterprise }, { data: base }] = await Promise.all([
      supabase.from('enterprises').select('id, base_id, type').eq('id', id).single(),
      supabase.from('bases').select('id, name, status').eq('id', baseId).single(),
    ]);

    if (!enterprise) {
      return NextResponse.json({ success: false, error: '企业不存在' }, { status: 404 });
    }
    if (!base || base.status !== 'active') {
      return NextResponse.json({ success: false, error: '所选基地不可用' }, { status: 400 });
    }

    const { data: tenantRelation } = await supabase
      .from('enterprise_base_relations')
      .select('id')
      .eq('enterprise_id', id)
      .eq('base_id', baseId)
      .eq('relation_type', 'tenant')
      .eq('status', 'active')
      .single();

    if (tenantRelation) {
      return NextResponse.json(
        { success: false, error: '该企业已入驻此基地，无需重复添加服务关系' },
        { status: 400 }
      );
    }

    const { data: existingRelation } = await supabase
      .from('enterprise_base_relations')
      .select('id')
      .eq('enterprise_id', id)
      .eq('base_id', baseId)
      .eq('relation_type', 'service')
      .eq('status', 'active')
      .single();

    if (existingRelation) {
      return NextResponse.json({ success: true, data: existingRelation });
    }

    const { data: relation, error: relationError } = await supabase
      .from('enterprise_base_relations')
      .insert({
        id: crypto.randomUUID(),
        enterprise_id: id,
        base_id: baseId,
        relation_type: 'service',
        status: 'active',
        source: 'manual',
      })
      .select()
      .single();

    if (relationError) {
      console.error('添加服务基地失败:', relationError);
      return NextResponse.json({ success: false, error: '添加服务基地失败' }, { status: 500 });
    }

    if (!enterprise.base_id && enterprise.type === 'non_tenant') {
      await supabase.from('enterprises').update({ base_id: baseId }).eq('id', id);
    }

    return NextResponse.json({ success: true, data: relation });
  } catch (error) {
    console.error('添加服务基地失败:', error);
    return NextResponse.json({ success: false, error: '添加服务基地失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();
    const relationId = typeof body.relation_id === 'string' ? body.relation_id : '';

    const { data: relation } = await supabase
      .from('enterprise_base_relations')
      .select('id, base_id, relation_type, status')
      .eq('id', relationId)
      .eq('enterprise_id', id)
      .single();

    if (!relation || relation.status !== 'active' || relation.relation_type !== 'service') {
      return NextResponse.json({ success: false, error: '服务基地关系不存在' }, { status: 404 });
    }

    const { data: enterprise } = await supabase
      .from('enterprises')
      .select('id, base_id, type')
      .eq('id', id)
      .single();
    const { data: serviceRelations } = await supabase
      .from('enterprise_base_relations')
      .select('id, base_id')
      .eq('enterprise_id', id)
      .eq('relation_type', 'service')
      .eq('status', 'active');

    if (enterprise?.type === 'non_tenant' && (serviceRelations || []).length <= 1) {
      return NextResponse.json(
        { success: false, error: '服务企业至少需要保留一个主要服务基地' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('enterprise_base_relations')
      .update({ status: 'ended', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', relationId);

    if (updateError) {
      console.error('移除服务基地失败:', updateError);
      return NextResponse.json({ success: false, error: '移除服务基地失败' }, { status: 500 });
    }

    if (enterprise?.base_id === relation.base_id) {
      const nextPrimary = (serviceRelations || []).find(item => item.id !== relationId);
      if (nextPrimary) {
        await supabase.from('enterprises').update({ base_id: nextPrimary.base_id }).eq('id', id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移除服务基地失败:', error);
    return NextResponse.json({ success: false, error: '移除服务基地失败' }, { status: 500 });
  }
}
