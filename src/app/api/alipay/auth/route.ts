import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alipay/auth
 * 获取支付宝授权链接
 * 代理到后端 API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUri = searchParams.get('redirect_uri');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const url = `${apiBaseUrl}/api/alipay/auth${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`;

    const response = await fetch(url);
    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取授权链接失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取授权链接失败',
    }, { status: 500 });
  }
}
