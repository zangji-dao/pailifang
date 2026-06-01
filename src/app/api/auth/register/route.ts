import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 代理后端设置的 cookie
    const setCookieHeader = response.headers.get('set-cookie');
    const nextResponse = NextResponse.json(data);

    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }

    // 同时在 Next.js 侧也设置 auth-token cookie（用于 SSR 中间件认证）
    if (data.token) {
      nextResponse.cookies.set('auth-token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { error: '注册服务暂时不可用，请稍后重试' },
      { status: 503 }
    );
  }
}
