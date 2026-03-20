/**
 * GET /api/alipay/auth
 * 获取支付宝授权链接
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUri = searchParams.get('redirect_uri');

    const url = `${config.backend.baseUrl}/api/alipay/auth${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`;

    const response = await fetch(url);
    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取授权链接失败:', error);
    return NextResponse.json(
      { success: false, error: '获取授权链接失败' },
      { status: 500 }
    );
  }
}
