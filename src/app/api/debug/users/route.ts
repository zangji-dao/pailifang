import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/storage/database/db";

export async function GET(req: NextRequest) {
  try {
    const data = await db.select().from(users);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("查询用户失败:", error);
    return NextResponse.json(
      { error: "查询用户失败" },
      { status: 500 }
    );
  }
}
