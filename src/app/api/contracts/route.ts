import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/contracts
 * 获取合同列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const enterpriseId = searchParams.get("enterpriseId");

    let query = client
      .from("contracts")
      .select(`
        id,
        contract_number,
        start_date,
        end_date,
        monthly_rent,
        deposit,
        enterprise_id,
        space_id,
        status,
        created_at,
        enterprises (
          id,
          name
        ),
        spaces (
          id,
          code,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (enterpriseId) {
      query = query.eq("enterprise_id", enterpriseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取合同列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取合同列表失败" },
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      contractNumber: item.contract_number,
      startDate: item.start_date,
      endDate: item.end_date,
      monthlyRent: item.monthly_rent,
      deposit: item.deposit,
      enterpriseId: item.enterprise_id,
      spaceId: item.space_id,
      status: item.status,
      createdAt: item.created_at,
      enterprise: item.enterprises,
      space: item.spaces,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取合同列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取合同列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts
 * 创建合同
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      enterpriseId,
      contractNumber,
      startDate,
      endDate,
      monthlyRent,
      deposit,
      spaceId,
    } = body;

    if (!enterpriseId || !contractNumber) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("contracts")
      .insert({
        enterprise_id: enterpriseId,
        contract_number: contractNumber,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: monthlyRent || 0,
        deposit: deposit || 0,
        space_id: spaceId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("创建合同失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "创建合同失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        contractNumber: data.contract_number,
      },
    });
  } catch (error) {
    console.error("创建合同失败:", error);
    return NextResponse.json(
      { success: false, error: "创建合同失败" },
      { status: 500 }
    );
  }
}
