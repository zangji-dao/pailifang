import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4001";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth-token")?.value;
  const token = authorization?.replace(/^Bearer\s+/i, "") || cookieToken;

  if (!token) {
    return NextResponse.json({ success: false, error: "未授权访问" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Current user proxy error:", error);
    return NextResponse.json(
      { success: false, error: "登录状态查询失败" },
      { status: 503 },
    );
  }
}
