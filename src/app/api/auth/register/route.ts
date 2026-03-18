import { NextRequest, NextResponse } from "next/server";
import { db, users, eq } from "@/storage/database/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = "accountant", phone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱、密码和姓名不能为空" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 创建用户
    const result = await db.insert(users).values({
      email,
      password,
      name,
      role,
      phone,
    });

    // 查询刚创建的用户
    const newUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const newUser = newUserResult[0];

    if (!newUser) {
      return NextResponse.json(
        { error: "创建用户失败" },
        { status: 500 }
      );
    }

    // 返回用户信息（不返回密码）
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("注册错误:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
