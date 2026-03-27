import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/contracts
 * 创建合同
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // 生成合同ID
    const contractId = crypto.randomUUID();

    // 构建合同数据
    const contractData = {
      id: contractId,
      contract_number: body.contract_number || `HT-${Date.now()}`,
      contract_type: body.contract_type || 'free',
      enterprise_id: body.enterprise_id || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      amount: body.amount || 0,
      deposit: body.deposit || 0,
      status: body.status || 'draft',
      attachment_url: body.attachment_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      console.error('创建合同失败:', error);
      return NextResponse.json(
        { success: false, error: `创建合同失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('创建合同失败:', error);
    return NextResponse.json(
      { success: false, error: '创建合同失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts
 * 获取合同列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const enterpriseId = searchParams.get('enterprise_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (enterpriseId) {
      query = query.eq('enterprise_id', enterpriseId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取合同列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取合同列表失败' },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      contractNumber: item.contract_number,
      contractType: item.contract_type,
      enterpriseId: item.enterprise_id,
      startDate: item.start_date,
      endDate: item.end_date,
      amount: item.amount,
      deposit: item.deposit,
      status: item.status,
      attachmentUrl: item.attachment_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('获取合同列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取合同列表失败' },
      { status: 500 }
    );
  }
}
