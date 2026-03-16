import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = "accountant", phone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱、密码和姓名不能为空" },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查邮箱是否已存在
    const { data: existingUser } = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 创建用户
    const { data: newUser, error: insertError } = await client
      .from("users")
      .insert({
        email,
        password,
        name,
        role,
        phone,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error("创建用户失败:", insertError);
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
