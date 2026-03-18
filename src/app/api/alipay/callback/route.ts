import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken, isAlipayConfigured } from '@/lib/alipay';
import { db, alipayAuthTokens, eq } from '@/storage/database/db';

/**
 * GET /api/alipay/callback
 * 支付宝授权回调接口
 * 支付宝会在用户授权后重定向到此地址，带上 auth_code
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAlipayConfigured()) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=alipay_not_configured', request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const authCode = searchParams.get('auth_code');
    const state = searchParams.get('state'); // 可用于传递用户ID等状态信息

    // 检查是否有授权码
    if (!authCode) {
      const error = searchParams.get('error') || 'unknown';
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=alipay_${error}`, request.url)
      );
    }

    // 用授权码换取令牌
    const tokenResult = await exchangeToken(authCode);

    if (!tokenResult.success || !tokenResult.data) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(tokenResult.error || '授权失败')}`, request.url)
      );
    }

    const { accessToken, refreshToken, userId: alipayUserId, expiresAt, refreshExpiresAt } = tokenResult.data;

    // 从state中解析用户ID（需要在生成授权链接时传入）
    // 这里假设使用默认用户ID，实际应用中应该从session或state中获取
    const systemUserId = state || 'default-user-id';

    // 检查是否已有授权记录
    const existing = await db
      .select()
      .from(alipayAuthTokens)
      .where(eq(alipayAuthTokens.userId, systemUserId))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有记录
      await db
        .update(alipayAuthTokens)
        .set({
          alipayUserId: alipayUserId,
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAt,
          refreshExpiresAt: refreshExpiresAt,
        })
        .where(eq(alipayAuthTokens.userId, systemUserId));
    } else {
      // 插入新记录
      await db.insert(alipayAuthTokens).values({
        userId: systemUserId,
        alipayUserId: alipayUserId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: 0, // 已过期字段，可忽略
        reExpiresIn: 0,
        authTime: new Date(),
        expiresAt: expiresAt,
        refreshExpiresAt: refreshExpiresAt,
      });
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
