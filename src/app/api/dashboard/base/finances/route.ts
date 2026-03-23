import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 获取资金列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const enterpriseId = searchParams.get("enterpriseId");
    const search = searchParams.get("search");

    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('finances')
      .select('*', { count: 'exact' });

    // 应用过滤
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (enterpriseId) {
      query = query.eq('enterprise_id', enterpriseId);
    }
    if (search) {
      query = query.ilike('item_name', `%${search}%`);
    }

    // 执行查询
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("获取资金列表失败:", error);
      return NextResponse.json({ error: "获取资金列表失败" }, { status: 500 });
    }

    // 获取关联的企业和基地信息
    const enterpriseIds = [...new Set((data || []).map((item: Record<string, unknown>) => item.enterprise_id).filter(Boolean))];
    const siteIds = [...new Set((data || []).map((item: Record<string, unknown>) => item.site_id).filter(Boolean))];

    const [enterprisesResult, sitesResult] = await Promise.all([
      enterpriseIds.length > 0 
        ? supabase.from('enterprises').select('id, name, credit_code').in('id', enterpriseIds)
        : { data: [] },
      siteIds.length > 0
        ? supabase.from('sites').select('id, name').in('id', siteIds)
        : { data: [] },
    ]);

    // 构建映射
    const enterpriseMap = new Map(
      (enterprisesResult.data || []).map((e: Record<string, unknown>) => [e.id, e])
    );
    const siteMap = new Map(
      (sitesResult.data || []).map((s: Record<string, unknown>) => [s.id, s])
    );

    // 格式化数据
    const formattedData = (data || []).map((item: Record<string, unknown>) => {
      const enterprise = enterpriseMap.get(item.enterprise_id as string) as Record<string, unknown> | undefined;
      const site = siteMap.get(item.site_id as string) as Record<string, unknown> | undefined;
      return {
        ...item,
        enterprise_name: enterprise?.name || '',
        enterprise_credit_code: enterprise?.credit_code || null,
        site_name: site?.name || null,
      };
    });

    // 统计数据
    const { data: statsData } = await supabase
      .from('finances')
      .select('type, status, amount, refunded_amount');

    const stats = {
      byType: {} as Record<string, { total: number; count: number }>,
      byStatus: {} as Record<string, { total: number; count: number }>,
      totalReceived: 0,
      totalRefunded: 0,
    };

    (statsData || []).forEach((row: Record<string, unknown>) => {
      const amount = parseFloat(row.amount as string) || 0;
      const refunded = parseFloat(row.refunded_amount as string) || 0;
      const rowType = row.type as string;
      const rowStatus = row.status as string;

      if (!stats.byType[rowType]) {
        stats.byType[rowType] = { total: 0, count: 0 };
      }
      stats.byType[rowType].total += amount;
      stats.byType[rowType].count += 1;

      if (!stats.byStatus[rowStatus]) {
        stats.byStatus[rowStatus] = { total: 0, count: 0 };
      }
      stats.byStatus[rowStatus].total += amount;
      stats.byStatus[rowStatus].count += 1;

      if (rowStatus !== "pending") {
        stats.totalReceived += amount;
      }
      stats.totalRefunded += refunded;
    });

    return NextResponse.json({
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      stats,
    });
  } catch (error) {
    console.error("获取资金列表失败:", error);
    return NextResponse.json({ error: "获取资金列表失败" }, { status: 500 });
  }
}

// 创建资金记录
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const {
      enterprise_id,
      type,
      deposit_type,
      item_name,
      amount,
      payment_method,
      status = "pending",
      paid_at,
      remarks,
      site_id,
    } = body;

    // 验证必填字段
    if (!enterprise_id || !type || !item_name || !amount) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // 如果是押金类型，需要指定押金类型
    if (type === "deposit" && !deposit_type) {
      return NextResponse.json({ error: "押金需要指定押金类型" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('finances')
      .insert({
        enterprise_id,
        type,
        deposit_type: deposit_type || null,
        item_name,
        amount,
        payment_method: payment_method || null,
        status,
        paid_at: paid_at || (status === "paid" ? new Date().toISOString() : null),
        remarks: remarks || null,
        site_id: site_id || null,
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
