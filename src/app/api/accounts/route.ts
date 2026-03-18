import { NextRequest, NextResponse } from "next/server";
import { db, chartOfAccounts, eq, and, or, like, isNull, asc, desc } from "@/storage/database/db";

/**
 * 获取科目列表
 * GET /api/accounts?ledgerId=xxx&type=asset
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const ledgerId = searchParams.get("ledgerId");
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    // 构建查询条件
    const conditions = [];
    if (ledgerId) conditions.push(eq(chartOfAccounts.ledgerId, ledgerId));
    if (type) conditions.push(eq(chartOfAccounts.type, type));
    if (parentId !== null) {
      if (parentId === "null" || parentId === "") {
        conditions.push(isNull(chartOfAccounts.parentId));
      } else {
        conditions.push(eq(chartOfAccounts.parentId, parentId));
      }
    }
    if (isActive !== null) {
      conditions.push(eq(chartOfAccounts.isActive, isActive === "true"));
    }
    if (search) {
      conditions.push(or(
        like(chartOfAccounts.code, `%${search}%`),
        like(chartOfAccounts.name, `%${search}%`)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(chartOfAccounts)
      .where(whereClause)
      .orderBy(asc(chartOfAccounts.code));

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("获取科目列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取科目列表失败" },
      { status: 500 }
    );
  }
}

/**
 * 创建科目
 * POST /api/accounts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 检查编码是否已存在
    const existing = await db
      .select()
      .from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.ledgerId, body.ledgerId),
        eq(chartOfAccounts.code, body.code)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "科目编码已存在" },
        { status: 400 }
      );
    }

    // 计算科目层级
    let level = 1;
    if (body.parentId) {
      const parent = await db
        .select()
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.id, body.parentId))
        .limit(1);

      if (parent.length > 0) {
        level = (parent[0].level || 1) + 1;

        // 更新父节点为非叶子节点
        await db
          .update(chartOfAccounts)
          .set({ isLeaf: false })
          .where(eq(chartOfAccounts.id, body.parentId));
      }
    }

    const result = await db.insert(chartOfAccounts).values({
      ledgerId: body.ledgerId,
      code: body.code,
      name: body.name,
      parentId: body.parentId || null,
      level,
      type: body.type,
      direction: body.direction,
      isLeaf: true,
      isActive: body.isActive ?? true,
      remark: body.remark || null,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "创建科目成功",
    });
  } catch (error) {
    console.error("创建科目失败:", error);
    return NextResponse.json(
      { success: false, error: "创建科目失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新科目
 * PUT /api/accounts
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少科目ID" },
        { status: 400 }
      );
    }

    // 检查科目是否存在
    const existing = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "科目不存在" },
        { status: 404 }
      );
    }

    const existingAccount = existing[0];

    // 如果是系统预设科目（一级科目），只允许修改状态
    if (existingAccount.level === 1) {
      const allowedUpdate: Record<string, unknown> = {};
      
      if (updateData.isActive !== undefined) {
        allowedUpdate.isActive = updateData.isActive;
      }
      if (updateData.remark !== undefined) {
        allowedUpdate.remark = updateData.remark;
      }

      await db
        .update(chartOfAccounts)
        .set(allowedUpdate)
        .where(eq(chartOfAccounts.id, id));

      return NextResponse.json({
        success: true,
        message: "更新科目成功",
      });
    }

    // 明细科目可以修改更多信息
    const dataToUpdate: Record<string, unknown> = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;
    if (updateData.remark !== undefined) dataToUpdate.remark = updateData.remark;

    await db
      .update(chartOfAccounts)
      .set(dataToUpdate)
      .where(eq(chartOfAccounts.id, id));

    return NextResponse.json({
      success: true,
      message: "更新科目成功",
    });
  } catch (error) {
    console.error("更新科目失败:", error);
    return NextResponse.json(
      { success: false, error: "更新科目失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除科目
 * DELETE /api/accounts?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少科目ID" },
        { status: 400 }
      );
    }

    // 检查科目是否存在
    const existing = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "科目不存在" },
        { status: 404 }
      );
    }

    const existingAccount = existing[0];

    // 一级科目不允许删除
    if (existingAccount.level === 1) {
      return NextResponse.json(
        { success: false, error: "系统预设科目不允许删除" },
        { status: 400 }
      );
    }

    // 检查是否有下级科目
    const children = await db
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.parentId, id));

    if (children.length > 0) {
      return NextResponse.json(
        { success: false, error: "存在下级科目，无法删除" },
        { status: 400 }
      );
    }

    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));

    return NextResponse.json({
      success: true,
      message: "删除科目成功",
    });
  } catch (error) {
    console.error("删除科目失败:", error);
    return NextResponse.json(
      { success: false, error: "删除科目失败" },
      { status: 500 }
    );
  }
}
