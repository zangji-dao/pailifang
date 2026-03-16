import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function GET(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client.from("work_orders").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("获取工单列表失败:", error);
      return NextResponse.json(
        { error: "获取工单列表失败" },
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
    console.error("获取工单列表失败:", error);
    return NextResponse.json(
      { error: "获取工单列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("work_orders")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("创建工单失败:", error);
      return NextResponse.json({ error: "创建工单失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("创建工单失败:", error);
    return NextResponse.json(
      { error: "创建工单失败" },
      { status: 500 }
    );
  }
}
