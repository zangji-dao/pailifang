import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 1. 获取基地信息
    const { data: base, error: baseError } = await client
      .from("bases")
      .select("*")
      .eq("id", id)
      .single();

    if (baseError || !base) {
      return NextResponse.json({ error: "基地不存在" }, { status: 404 });
    }

    // 2. 获取物业列表
    const { data: meters, error: metersError } = await client
      .from("meters")
      .select("*")
      .eq("base_id", id)
      .order("code", { ascending: true });

    if (metersError) {
      return NextResponse.json({ error: metersError.message }, { status: 500 });
    }

    // 3. 获取所有物理空间
    const meterIds = (meters || []).map((m: any) => m.id);
    const { data: spaces, error: spacesError } = await client
      .from("spaces")
      .select("*")
      .in("meter_id", meterIds)
      .order("code", { ascending: true });

    if (spacesError) {
      return NextResponse.json({ error: spacesError.message }, { status: 500 });
    }

    // 4. 获取所有注册号
    const spaceIds = (spaces || []).map((s: any) => s.id);
    const { data: regNumbers, error: regError } = await client
      .from("reg_numbers")
      .select("*")
      .in("space_id", spaceIds);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // 5. 获取所有企业信息
    const enterpriseIds = (regNumbers || [])
      .filter((r: any) => r.enterprise_id)
      .map((r: any) => r.enterprise_id);

    let enterprises: any[] = [];
    if (enterpriseIds.length > 0) {
      const { data: enterprisesData, error: entError } = await client
        .from("enterprises")
        .select("*")
        .in("id", enterpriseIds);
      
      if (!entError && enterprisesData) {
        enterprises = enterprisesData;
      }
    }

    // 6. 组装数据结构
    const enterpriseMap = new Map(enterprises.map((e: any) => [e.id, e]));
    const spaceMap = new Map((spaces || []).map((s: any) => [s.id, s]));
    const regBySpace = new Map<string, any[]>();
    
    (regNumbers || []).forEach((reg: any) => {
      if (!regBySpace.has(reg.space_id)) {
        regBySpace.set(reg.space_id, []);
      }
      const regWithEnterprise = {
        ...reg,
        enterprise: reg.enterprise_id ? enterpriseMap.get(reg.enterprise_id) : null,
      };
      regBySpace.get(reg.space_id)!.push(regWithEnterprise);
    });

    const metersWithSpaces = (meters || []).map((meter: any) => ({
      ...meter,
      spaces: (spaces || [])
        .filter((s: any) => s.meter_id === meter.id)
        .map((space: any) => ({
          ...space,
          regNumbers: regBySpace.get(space.id) || [],
        })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...base,
        meters: metersWithSpaces,
      },
    });
  } catch (error: any) {
    console.error("获取基地详情失败:", error);
    return NextResponse.json(
      { error: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
