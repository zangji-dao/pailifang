import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/reg-numbers
 * 获取注册号列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const spaceId = searchParams.get("spaceId");
    const status = searchParams.get("status");

    let query = client
      .from("reg_numbers")
      .select(`
        id,
        code,
        status,
        space_id,
        enterprise_id,
        created_at,
        spaces (
          id,
          code,
          name
        )
      `)
      .order("code");

    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取注册号列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取注册号列表失败" },
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      code: item.code,
      status: item.status,
      spaceId: item.space_id,
      enterpriseId: item.enterprise_id,
      createdAt: item.created_at,
      space: item.spaces,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取注册号列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取注册号列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reg-numbers
 * 分配注册号（自动分配一个未使用的注册号）
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { enterpriseId } = body;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: "缺少企业ID" },
        { status: 400 }
      );
    }

    // 查找可用的注册号
    const { data: availableRegNumbers, error: queryError } = await client
      .from("reg_numbers")
      .select("id, code, space_id")
      .is("enterprise_id", null)
      .eq("status", "active")
      .order("code")
      .limit(1);

    if (queryError) {
      console.error("查询可用注册号失败:", queryError);
      return NextResponse.json(
        { success: false, error: "查询可用注册号失败" },
        { status: 500 }
      );
    }

    if (!availableRegNumbers || availableRegNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有可用的注册号，请联系管理员添加" },
        { status: 400 }
      );
    }

    const regNumber = availableRegNumbers[0];

    // 更新注册号
    const { error: updateError } = await client
      .from("reg_numbers")
      .update({
        enterprise_id: enterpriseId,
        status: "assigned",
      })
      .eq("id", regNumber.id);

    if (updateError) {
      console.error("分配注册号失败:", updateError);
      return NextResponse.json(
        { success: false, error: "分配注册号失败" },
        { status: 500 }
      );
    }

    // 同时更新企业的注册号
    await client
      .from("enterprises")
      .update({ registration_number: regNumber.code })
      .eq("id", enterpriseId);

    return NextResponse.json({
      success: true,
      data: {
        id: regNumber.id,
        code: regNumber.code,
        spaceId: regNumber.space_id,
      },
    });
  } catch (error) {
    console.error("分配注册号失败:", error);
    return NextResponse.json(
      { success: false, error: "分配注册号失败" },
      { status: 500 }
    );
  }
}
