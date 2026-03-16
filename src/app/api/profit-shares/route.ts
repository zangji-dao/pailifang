import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function GET(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const salesId = searchParams.get("salesId");
    const accountantId = searchParams.get("accountantId");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client.from("profit_shares").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (period) {
      query = query.eq("period", period);
    }

    if (salesId) {
      query = query.eq("sales_id", salesId);
    }

    if (accountantId) {
      query = query.eq("accountant_id", accountantId);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("获取分润列表失败:", error);
      return NextResponse.json(
        { error: "获取分润列表失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取分润列表失败:", error);
    return NextResponse.json(
      { error: "获取分润列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("profit_shares")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("创建分润记录失败:", error);
      return NextResponse.json({ error: "创建分润记录失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("创建分润记录失败:", error);
    return NextResponse.json(
      { error: "创建分润记录失败" },
      { status: 500 }
    );
  }
}
