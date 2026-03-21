import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/tenants
 * 获取企业列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let query = client
      .from("enterprises")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取企业列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取企业列表失败" },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const formattedData = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      creditCode: item.credit_code,
      legalPerson: item.legal_person,
      phone: item.phone,
      industry: item.industry,
      status: item.status,
      type: item.type,
      registeredAddress: item.registered_address,
      businessAddress: item.business_address,
      settledDate: item.settled_date,
      remarks: item.remarks,
      createdAt: item.created_at,
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
 * POST /api/tenants
 * 创建企业
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      name,
      credit_code,
      legal_person,
      phone,
      industry,
      type,
      status,
      registered_address,
      business_address,
      settled_date,
      remarks,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "企业名称为必填项" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("enterprises")
      .insert({
        name,
        credit_code: credit_code || null,
        legal_person: legal_person || null,
        phone: phone || null,
        industry: industry || null,
        type: type || "tenant",
        status: status || "pending",
        registered_address: registered_address || null,
        business_address: business_address || null,
        settled_date: settled_date || null,
        remarks: remarks || null,
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

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        creditCode: data.credit_code,
        legalPerson: data.legal_person,
        status: data.status,
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
