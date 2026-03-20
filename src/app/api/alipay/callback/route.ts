/**
 * GET /api/alipay/callback
 * 支付宝授权回调接口
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authCode = searchParams.get('auth_code');
  const state = searchParams.get('state');

  if (!authCode) {
    const error = searchParams.get('error') || 'unknown';
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=alipay_${error}`, request.url)
    );
  }

  try {
    const response = await fetch(`${config.backend.baseUrl}/api/alipay/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authCode,
        userId: state || 'default-user-id',
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(result.error || '授权失败')}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/settings?alipay_auth=success', request.url)
    );
  } catch (error) {
    console.error('支付宝授权回调处理失败:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(error instanceof Error ? error.message : '授权失败')}`, request.url)
    );
  }
}
