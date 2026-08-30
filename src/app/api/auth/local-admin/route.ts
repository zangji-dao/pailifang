import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4101";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function getHostname(value: string | null) {
  if (!value) return "";
  try {
    const url = value.includes("://") ? value : `http://${value}`;
    return new URL(url).hostname.toLowerCase();
  } catch {
    const host = value.toLowerCase();
    return host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  }
}

export async function POST(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.LOCAL_ADMIN_ONE_CLICK_ENABLED !== "true"
  ) {
    return NextResponse.json({ success: false, error: "接口不存在" }, { status: 404 });
  }

  const requestHost = getHostname(request.headers.get("host"));
  const originHost = getHostname(request.headers.get("origin"));
  if (!LOCAL_HOSTS.has(requestHost) || !LOCAL_HOSTS.has(originHost)) {
    return NextResponse.json({ success: false, error: "仅允许本机访问" }, { status: 403 });
  }

  const email = process.env.LOCAL_ADMIN_EMAIL;
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "本机管理员账号未配置" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    if (response.ok && data.token) {
      nextResponse.cookies.set("auth-token", data.token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    return nextResponse;
  } catch (error) {
    console.error("Local admin login error:", error);
    return NextResponse.json(
      { success: false, error: "本机管理员登录服务不可用" },
      { status: 503 },
    );
  }
}
