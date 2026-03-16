import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function GET(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .select("*");

    return NextResponse.json({
      success: true,
      data,
      error,
    });
  } catch (error) {
    console.error("查询用户失败:", error);
    return NextResponse.json(
      { error: "查询用户失败" },
      { status: 500 }
    );
  }
}
