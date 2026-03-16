import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl, isAlipayConfigured } from '@/lib/alipay';

/**
 * GET /api/alipay/auth
 * 获取支付宝授权链接
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAlipayConfigured()) {
      return NextResponse.json({
        success: false,
        error: '支付宝未配置，请先配置环境变量',
      }, { status: 500 });
    }

    // 从请求中获取回调地址（可选）
    const searchParams = request.nextUrl.searchParams;
    const customRedirectUri = searchParams.get('redirect_uri');

    // 生成授权链接
    const authUrl = generateAuthUrl(customRedirectUri || undefined);

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        message: '请引导用户访问此链接进行支付宝授权',
      },
    });
  } catch (error) {
    console.error('生成授权链接失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成授权链接失败',
    }, { status: 500 });
  }
}
