import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// Π立方基地物业数据
const METER_DATA = [
  { code: "1-102", name: "1号楼102室", water: "897357", electricity: "2200922309755", heating: "270602", area: "276.44" },
  { code: "1-103", name: "1号楼103室", water: "897358", electricity: "2200922309742", heating: "270603", area: "282.95" },
  { code: "1-104", name: "1号楼104室", water: "897359", electricity: "2200922309713", heating: "270604", area: "274.79" },
  { code: "1-105", name: "1号楼105室", water: "897360", electricity: "2200922309726", heating: "270605", area: "280.12" },
  { code: "1-106", name: "1号楼106室", water: "897361", electricity: "2200922309713", heating: "270606", area: "275.64" },
  { code: "1-107", name: "1号楼107室", water: "897362", electricity: "2200922309700", heating: "270607", area: "274.79" },
  { code: "1-108", name: "1号楼108室", water: "897393", electricity: "2200922309696", heating: "270608", area: "276.44" },
  { code: "2-104", name: "2号楼104室", water: "897367", electricity: "2200922309814", heating: "270784", area: "255.79" },
];

export async function POST(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const results: any = {};

    // 1. 创建基地
    const { data: existingBase } = await client
      .from("bases")
      .select("id")
      .eq("name", "Π立方企服中心")
      .single();

    let baseId: string;
    if (!existingBase) {
      const { data: newBase, error: baseError } = await client
        .from("bases")
        .insert({
          name: "Π立方企服中心",
          address: "吉林省松原市宁江区义乌城",
          status: "active",
        })
        .select()
        .single();

      if (baseError) {
        return NextResponse.json({ error: baseError.message }, { status: 500 });
      }
      baseId = newBase.id;
      results.base = newBase;
    } else {
      baseId = existingBase.id;
      results.base = existingBase;
    }

    // 2. 创建物业
    const { data: existingMeters } = await client
      .from("meters")
      .select("id")
      .eq("base_id", baseId);

    if (!existingMeters || existingMeters.length === 0) {
      const metersToInsert = METER_DATA.map(meter => ({
        base_id: baseId,
        code: meter.code,
        name: meter.name,
        water_number: meter.water,
        electricity_number: meter.electricity,
        heating_number: meter.heating,
        water_type: "base",
        electricity_type: "base",
        heating_type: "base",
        area: meter.area,
        status: "active",
      }));

      const { data: newMeters, error: metersError } = await client
        .from("meters")
        .insert(metersToInsert)
        .select();

      if (metersError) {
        return NextResponse.json({ error: metersError.message }, { status: 500 });
      }
      results.meters = newMeters;

      // 3. 为每个物业创建默认物理空间
      if (newMeters) {
        const spacesToInsert = newMeters.map((meter: any) => ({
          meter_id: meter.id,
          code: "主空间",
          name: "主办公区",
          area: meter.area,
          status: "active",
        }));

        const { data: newSpaces, error: spacesError } = await client
          .from("spaces")
          .insert(spacesToInsert)
          .select();

        if (spacesError) {
          return NextResponse.json({ error: spacesError.message }, { status: 500 });
        }
        results.spaces = newSpaces;
      }
    } else {
      results.meters = existingMeters;
      results.message = "物业数据已存在，跳过创建";
    }

    return NextResponse.json({
      success: true,
      message: "基地数据初始化成功",
      data: results,
    });
  } catch (error: any) {
    console.error("初始化基地数据失败:", error);
    return NextResponse.json(
      { error: error.message || "初始化失败" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = getSupabaseClient();

    // 获取基地列表
    const { data: bases, error: basesError } = await client
      .from("bases")
      .select("*")
      .order("created_at", { ascending: false });

    if (basesError) {
      return NextResponse.json({ error: basesError.message }, { status: 500 });
    }

    // 获取每个基地的物业数量
    const basesWithStats = await Promise.all(
      (bases || []).map(async (base: any) => {
        const { count: meterCount } = await client
          .from("meters")
          .select("*", { count: "exact", head: true })
          .eq("base_id", base.id);

        return {
          ...base,
          meterCount: meterCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: basesWithStats,
    });
  } catch (error: any) {
    console.error("获取基地列表失败:", error);
    return NextResponse.json(
      { error: error.message || "获取失败" },
      { status: 500 }
    );
  }
}
