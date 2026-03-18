import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alipay/callback
 * 支付宝授权回调接口
 * 支付宝会在用户授权后重定向到此地址，带上 auth_code
 * 此接口仅处理重定向，实际 token 交换由后端 API 处理
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authCode = searchParams.get('auth_code');
  const state = searchParams.get('state');

  // 检查是否有授权码
  if (!authCode) {
    const error = searchParams.get('error') || 'unknown';
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=alipay_${error}`, request.url)
    );
  }

  try {
    // 调用后端 API 处理 token 交换
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const response = await fetch(`${apiBaseUrl}/api/alipay/callback`, {
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

    // 重定向到设置页面，显示授权成功
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
