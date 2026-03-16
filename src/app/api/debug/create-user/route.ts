import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(req: NextRequest) {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("users")
      .insert({
        email: "test@example.com",
        password: "test123",
        name: "测试用户",
        role: "accountant",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("创建用户失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json(
      { error: "创建用户失败" },
      { status: 500 }
    );
  }
}
