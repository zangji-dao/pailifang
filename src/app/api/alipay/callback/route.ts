/**
 * GET /api/alipay/callback
 * 支付宝授权回调接口
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');

  if (!host) {
    return request.nextUrl.origin;
  }

  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(':', '') || 'https';

  return `${protocol}://${host}`;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, getPublicOrigin(request)));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authCode = searchParams.get('auth_code');
  const state = searchParams.get('state');

  if (!authCode) {
    const error = searchParams.get('error') || 'unknown';
    return redirectTo(request, `/dashboard/base/sites?error=alipay_${error}`);
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
      return redirectTo(
        request,
        `/dashboard/base/sites?error=${encodeURIComponent(result.error || '授权失败')}`
      );
    }

    return redirectTo(request, '/dashboard/base/sites?alipay_auth=success');
  } catch (error) {
    console.error('支付宝授权回调处理失败:', error);
    return redirectTo(
      request,
      `/dashboard/base/sites?error=${encodeURIComponent(error instanceof Error ? error.message : '授权失败')}`
    );
  }
}
