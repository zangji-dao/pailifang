import { NextRequest, NextResponse } from "next/server";
import { db, users, eq, and } from "@/storage/database/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 查询用户
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);

    const userData = result[0];

    if (!userData) {
      return NextResponse.json(
        { error: "用户不存在或已被禁用" },
        { status: 401 }
      );
    }

    // 简单密码验证（实际项目中应该使用 bcrypt 等）
    if (userData.password !== password) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    // 返回用户信息（不返回密码）
    const { password: _, ...userWithoutPassword } = userData;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
