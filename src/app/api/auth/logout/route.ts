import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4101";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout proxy error:", error);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth-token");
  return response;
}
