import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 获取资金记录列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "30");
    const type = searchParams.get("type");
    const date = searchParams.get("date");

    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('finances')
      .select('*', { count: 'exact' });

    // 应用过滤
    if (type) {
      query = query.eq('type', type);
    }
    if (date) {
      query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`);
    }

    // 执行查询
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("获取资金记录失败:", error);
      return NextResponse.json({ error: "获取资金记录失败" }, { status: 500 });
    }

    // 获取关联企业信息
    const enterpriseIds = [...new Set((data || []).map((item: Record<string, unknown>) => item.enterprise_id).filter(Boolean))];
    
    let enterpriseMap = new Map();
    if (enterpriseIds.length > 0) {
      const { data: enterprises } = await supabase
        .from('enterprises')
        .select('id, name')
        .in('id', enterpriseIds);
      
      (enterprises || []).forEach((e: Record<string, unknown>) => {
        enterpriseMap.set(e.id, e.name);
      });
    }

    // 格式化数据
    const formattedData = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      enterprise_name: enterpriseMap.get(item.enterprise_id) || null,
    }));

    // 计算余额统计
    const { data: allRecords } = await supabase
      .from('finances')
      .select('type, amount');

    let income = 0;
    let expense = 0;
    (allRecords || []).forEach((record: Record<string, unknown>) => {
      const amount = parseFloat(record.amount as string) || 0;
      if (record.type === 'income') {
        income += amount;
      } else if (record.type === 'expense') {
        expense += amount;
      }
    });

    return NextResponse.json({
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      balance: {
        income,
        expense,
        total: income - expense,
      },
    });
  } catch (error) {
    console.error("获取资金记录失败:", error);
    return NextResponse.json({ error: "获取资金记录失败" }, { status: 500 });
  }
}

// 创建资金记录
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { type, amount, enterprise_id, summary, remarks } = body;

    // 验证必填字段
    if (!type || !amount || !summary) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('finances')
      .insert({
        type,
        amount,
        enterprise_id: enterprise_id || null,
        summary,
        remarks: remarks || null,
      })
      .select()
      .single();

    if (error) {
      console.error("创建资金记录失败:", error);
      return NextResponse.json({ error: "创建资金记录失败" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("创建资金记录失败:", error);
    return NextResponse.json({ error: "创建资金记录失败" }, { status: 500 });
  }
}
