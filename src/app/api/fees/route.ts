import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/fees
 * 获取费用列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const enterpriseId = searchParams.get("enterpriseId");
    const status = searchParams.get("status");

    let query = client
      .from("fees")
      .select(`
        id,
        fee_type,
        amount,
        payment_method,
        payment_date,
        status,
        enterprise_id,
        created_at,
        enterprises (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (enterpriseId) {
      query = query.eq("enterprise_id", enterpriseId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取费用列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取费用列表失败" },
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      feeType: item.fee_type,
      amount: item.amount,
      paymentMethod: item.payment_method,
      paymentDate: item.payment_date,
      status: item.status,
      enterpriseId: item.enterprise_id,
      createdAt: item.created_at,
      enterprise: item.enterprises,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取费用列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取费用列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fees
 * 创建费用记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      enterpriseId,
      feeType,
      amount,
      paymentMethod,
      paymentDate,
      status,
    } = body;

    if (!enterpriseId || !feeType) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("fees")
      .insert({
        enterprise_id: enterpriseId,
        fee_type: feeType,
        amount: amount || 0,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        status: status || "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("创建费用记录失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "创建费用记录失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        feeType: data.fee_type,
        amount: data.amount,
      },
    });
  } catch (error) {
    console.error("创建费用记录失败:", error);
    return NextResponse.json(
      { success: false, error: "创建费用记录失败" },
      { status: 500 }
    );
  }
}
