/**
 * GET /api/alipay/status
 * 查询支付宝授权状态
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const url = `${config.backend.baseUrl}/api/alipay/status${userId ? `?userId=${userId}` : ''}`;

    const response = await fetch(url);
    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('查询授权状态失败:', error);
    return NextResponse.json(
      { success: false, error: '查询授权状态失败' },
      { status: 500 }
    );
  }
}
