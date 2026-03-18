import { NextRequest, NextResponse } from "next/server";
import { db, bases, meters, spaces, regNumbers, enterprises, eq, asc, inArray } from "@/storage/database/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 获取基地信息
    const baseResult = await db
      .select()
      .from(bases)
      .where(eq(bases.id, id))
      .limit(1);

    if (baseResult.length === 0) {
      return NextResponse.json({ error: "基地不存在" }, { status: 404 });
    }

    const base = baseResult[0];

    // 2. 获取物业列表
    const metersList = await db
      .select()
      .from(meters)
      .where(eq(meters.baseId, id))
      .orderBy(asc(meters.code));

    // 3. 获取所有物理空间
    const meterIds = metersList.map((m) => m.id);
    const spacesList = meterIds.length > 0 
      ? await db
          .select()
          .from(spaces)
          .where(inArray(spaces.meterId, meterIds))
          .orderBy(asc(spaces.code))
      : [];

    // 4. 获取所有注册号
    const spaceIds = spacesList.map((s) => s.id);
    const regNumbersList = spaceIds.length > 0
      ? await db
          .select()
          .from(regNumbers)
          .where(inArray(regNumbers.spaceId, spaceIds))
      : [];

    // 5. 获取所有企业信息
    const enterpriseIds = regNumbersList
      .filter((r) => r.enterpriseId)
      .map((r) => r.enterpriseId!);

    const enterprisesList = enterpriseIds.length > 0
      ? await db
          .select()
          .from(enterprises)
          .where(inArray(enterprises.id, enterpriseIds))
      : [];

    // 6. 组装数据结构
    const enterpriseMap = new Map(enterprisesList.map((e) => [e.id, e]));
    const regBySpace = new Map<string, any[]>();
    
    regNumbersList.forEach((reg) => {
      if (!regBySpace.has(reg.spaceId)) {
        regBySpace.set(reg.spaceId, []);
      }
      const regWithEnterprise = {
        ...reg,
        enterprise: reg.enterpriseId ? enterpriseMap.get(reg.enterpriseId) : null,
      };
      regBySpace.get(reg.spaceId)!.push(regWithEnterprise);
    });

    const metersWithSpaces = metersList.map((meter) => ({
      ...meter,
      spaces: spacesList
        .filter((s) => s.meterId === meter.id)
        .map((space) => ({
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
