import { NextRequest, NextResponse } from "next/server";
import { db, customers, eq, or, like, desc, sql, and } from "@/storage/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (status) {
      conditions.push(eq(customers.status, status));
    }
    if (search) {
      conditions.push(or(
        like(customers.name, `%${search}%`),
        like(customers.contactPerson, `%${search}%`)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询数据
    const data = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(customers)
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
    console.error("获取客户列表失败:", error);
    return NextResponse.json(
      { error: "获取客户列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await db.insert(customers).values({
      name: body.name,
      contactPerson: body.contactPerson,
      contactPhone: body.contactPhone,
      email: body.email,
      address: body.address,
      salesId: body.salesId,
      status: body.status || 'potential',
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("创建客户失败:", error);
    return NextResponse.json(
      { error: "创建客户失败" },
      { status: 500 }
    );
  }
}
