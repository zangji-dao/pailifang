import { NextRequest, NextResponse } from "next/server";
import { db, profitShares, eq, desc, and, sql } from "@/storage/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const salesId = searchParams.get("salesId");
    const accountantId = searchParams.get("accountantId");

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (status) conditions.push(eq(profitShares.status, status));
    if (period) conditions.push(eq(profitShares.period, period));
    if (salesId) conditions.push(eq(profitShares.salesId, salesId));
    if (accountantId) conditions.push(eq(profitShares.accountantId, accountantId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询数据
    const data = await db
      .select()
      .from(profitShares)
      .where(whereClause)
      .orderBy(desc(profitShares.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(profitShares)
      .where(whereClause);
    const total = Number(countResult[0]?.count) || 0;

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取分润列表失败:", error);
    return NextResponse.json(
      { error: "获取分润列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await db.insert(profitShares).values({
      customerId: body.customerId,
      ledgerId: body.ledgerId,
      salesId: body.salesId,
      accountantId: body.accountantId,
      profitRuleId: body.profitRuleId,
      totalAmount: body.totalAmount,
      salesAmount: body.salesAmount,
      accountantAmount: body.accountantAmount,
      period: body.period,
      status: body.status || 'pending',
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      message: "创建分润记录成功",
    });
  } catch (error) {
    console.error("创建分润记录失败:", error);
    return NextResponse.json(
      { error: "创建分润记录失败" },
      { status: 500 }
    );
  }
}
