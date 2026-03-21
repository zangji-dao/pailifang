import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * GET /api/meters
 * 获取物业列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const baseId = searchParams.get("baseId");

    let query = client
      .from("meters")
      .select(`
        id,
        code,
        name,
        area,
        status,
        base_id,
        electricity_number,
        water_number,
        heating_number,
        spaces (
          id,
          code,
          name,
          area,
          status,
          reg_numbers (
            id,
            code,
            status,
            enterprise_id
          )
        )
      `)
      .order("code");

    if (baseId) {
      query = query.eq("base_id", baseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取物业列表失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "获取物业列表失败" },
        { status: 500 }
      );
    }

    // 格式化数据
    const formattedData = (data || []).map((meter) => ({
      id: meter.id,
      code: meter.code,
      name: meter.name,
      area: meter.area,
      status: meter.status,
      baseId: meter.base_id,
      electricityNumber: meter.electricity_number,
      waterNumber: meter.water_number,
      heatingNumber: meter.heating_number,
      spaces: (meter.spaces || []).map((space: any) => ({
        id: space.id,
        code: space.code,
        name: space.name,
        area: space.area,
        status: space.status,
        regNumbers: (space.reg_numbers || []).map((reg: any) => ({
          id: reg.id,
          code: reg.code,
          status: reg.status,
          enterpriseId: reg.enterprise_id,
        })),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取物业列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取物业列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meters
 * 创建物业
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      baseId,
      code,
      name,
      area,
      electricityNumber,
      electricityType,
      waterNumber,
      waterType,
      heatingNumber,
      heatingType,
    } = body;

    if (!baseId || !code) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("meters")
      .insert({
        base_id: baseId,
        code,
        name: name || code,
        area,
        electricity_number: electricityNumber,
        electricity_type: electricityType || "base",
        water_number: waterNumber,
        water_type: waterType || "base",
        heating_number: heatingNumber,
        heating_type: heatingType || "base",
        status: "available",
      })
      .select()
      .single();

    if (error) {
      console.error("创建物业失败:", error);
      return NextResponse.json(
        { success: false, error: error.message || "创建物业失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        code: data.code,
        name: data.name,
        area: data.area,
        status: data.status,
        baseId: data.base_id,
      },
    });
  } catch (error) {
    console.error("创建物业失败:", error);
    return NextResponse.json(
      { success: false, error: "创建物业失败" },
      { status: 500 }
    );
  }
}
