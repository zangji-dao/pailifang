import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/storage/database/db";

export async function POST(req: NextRequest) {
  try {
    await db.insert(users).values({
      email: "test@example.com",
      password: "test123",
      name: "测试用户",
      role: "accountant",
      isActive: true,
    });

    // 查询刚创建的用户
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"))
      .limit(1);

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json(
      { error: "创建用户失败" },
      { status: 500 }
    );
  }
}

import { eq } from "drizzle-orm";
