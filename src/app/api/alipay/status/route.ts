import { NextRequest, NextResponse } from 'next/server';
import { getAuthStatus } from '@/lib/alipay-auth-service';

/**
 * GET /api/alipay/status
 * 获取用户的支付宝授权状态
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求中获取用户ID（实际应用中应从session获取）
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user-id';

    const status = await getAuthStatus(userId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('获取授权状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取授权状态失败',
    }, { status: 500 });
  }
}
