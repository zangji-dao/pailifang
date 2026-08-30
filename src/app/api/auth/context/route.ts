import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4001";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth-token")?.value;
  const token = authorization?.replace(/^Bearer\s+/i, "") || cookieToken;

  if (!token) {
    return NextResponse.json({ success: false, error: "未授权访问" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/auth/context`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization context proxy error:", error);
    return NextResponse.json(
      { success: false, error: "组织切换失败" },
      { status: 503 },
    );
  }
}
