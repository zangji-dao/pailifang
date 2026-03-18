import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alipay/status
 * 查询支付宝授权状态
 * 代理到后端 API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const url = `${apiBaseUrl}/api/alipay/status${userId ? `?userId=${userId}` : ''}`;

    const response = await fetch(url);
    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('查询授权状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '查询授权状态失败',
    }, { status: 500 });
  }
}
