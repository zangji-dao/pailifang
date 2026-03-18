import { NextRequest, NextResponse } from "next/server";
import { db, workOrders, eq, desc, and, sql } from "@/storage/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (status) conditions.push(eq(workOrders.status, status));
    if (priority) conditions.push(eq(workOrders.priority, priority));
    if (assignedTo) conditions.push(eq(workOrders.assignedTo, assignedTo));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询数据
    const data = await db
      .select()
      .from(workOrders)
      .where(whereClause)
      .orderBy(desc(workOrders.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(workOrders)
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
    console.error("获取工单列表失败:", error);
    return NextResponse.json(
      { error: "获取工单列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await db.insert(workOrders).values({
      title: body.title,
      type: body.type,
      description: body.description,
      customerId: body.customerId,
      ledgerId: body.ledgerId,
      assignedTo: body.assignedTo,
      createdBy: body.createdBy,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      dueDate: body.dueDate,
    });

    return NextResponse.json({
      success: true,
      message: "创建工单成功",
    });
  } catch (error) {
    console.error("创建工单失败:", error);
    return NextResponse.json(
      { error: "创建工单失败" },
      { status: 500 }
    );
  }
}
