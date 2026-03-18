import { NextRequest, NextResponse } from "next/server";
import { db, ledgers, eq, desc, sql, and } from "@/storage/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const accountantId = searchParams.get("accountantId");

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (status) conditions.push(eq(ledgers.status, status));
    if (customerId) conditions.push(eq(ledgers.customerId, customerId));
    if (accountantId) conditions.push(eq(ledgers.accountantId, accountantId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询数据
    const data = await db
      .select()
      .from(ledgers)
      .where(whereClause)
      .orderBy(desc(ledgers.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(ledgers)
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
    console.error("获取账套列表失败:", error);
    return NextResponse.json(
      { error: "获取账套列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await db.insert(ledgers).values({
      name: body.name,
      customerId: body.customerId,
      accountantId: body.accountantId,
      year: body.year,
      status: body.status || 'active',
      description: body.description,
    });

    return NextResponse.json({
      success: true,
      message: "创建账套成功",
    });
  } catch (error) {
    console.error("创建账套失败:", error);
    return NextResponse.json(
      { error: "创建账套失败" },
      { status: 500 }
    );
  }
}
