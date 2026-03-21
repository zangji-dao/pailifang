import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/enterprises
 * 获取企业列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const baseId = searchParams.get("baseId");
    const status = searchParams.get("status");

    let query = client
      .from("enterprises")
      .select(`
        id,
        name,
        legal_person,
        phone,
        registration_number,
        business_scope,
        capital,
        status,
        base_id,
        space_id,
        created_at,
        bases (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (baseId) {
      query = query.eq("base_id", baseId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取企业列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取企业列表失败" },
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      legalPerson: item.legal_person,
      phone: item.phone,
      registrationNumber: item.registration_number,
      businessScope: item.business_scope,
      capital: item.capital,
      status: item.status,
      baseId: item.base_id,
      spaceId: item.space_id,
      createdAt: item.created_at,
      base: item.bases,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取企业列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取企业列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprises
 * 创建企业
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      name,
      legalPerson,
      idCard,
      phone,
      capital,
      businessScope,
      baseId,
      spaceId,
      status,
    } = body;

    if (!name || !legalPerson) {
      return NextResponse.json(
        { success: false, error: "企业名称和法人为必填项" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("enterprises")
      .insert({
        name,
        legal_person: legalPerson,
        id_card: idCard,
        phone,
        capital,
        business_scope: businessScope,
        base_id: baseId,
        space_id: spaceId,
        status: status || "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("创建企业失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "创建企业失败" },
        { status: 500 }
      );
    }

    // 更新房间状态
    if (spaceId) {
      await client
        .from("spaces")
        .update({ status: "occupied" })
        .eq("id", spaceId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        legalPerson: data.legal_person,
        registrationNumber: data.registration_number,
      },
    });
  } catch (error) {
    console.error("创建企业失败:", error);
    return NextResponse.json(
      { success: false, error: "创建企业失败" },
      { status: 500 }
    );
  }
}
