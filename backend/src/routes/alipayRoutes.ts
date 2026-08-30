/**
 * 支付宝路由
 */

import { Router, Request, Response } from 'express';
import {
  isAlipayConfigured,
  getAlipayConfigurationStatus,
  generateAuthUrl,
  exchangeToken,
  queryInstitutionBill,
  UtilityBillSubType,
} from '../services/alipay';
import { db, alipayAuthTokens, eq } from '../database/client';

const router = Router();

router.get('/configuration', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...getAlipayConfigurationStatus(),
    },
  });
});

/**
 * GET /api/alipay/auth
 * 获取支付宝授权链接
 */
router.get('/auth', (req: Request, res: Response) => {
  try {
    if (!isAlipayConfigured()) {
      return res.status(500).json({
        success: false,
        error: '支付宝未配置',
      });
    }

    const redirectUri = req.query.redirect_uri as string | undefined;
    const authUrl = generateAuthUrl(redirectUri);

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('生成授权链接失败:', error);
    res.status(500).json({
      success: false,
      error: '生成授权链接失败',
    });
  }
});

/**
 * POST /api/alipay/callback
 * 处理授权回调（交换 token）
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { authCode, userId } = req.body;

    if (!authCode) {
      return res.status(400).json({
        success: false,
        error: '缺少授权码',
      });
    }

    const tokenResult = await exchangeToken(authCode);

    if (!tokenResult.success || !tokenResult.data) {
      return res.status(400).json({
        success: false,
        error: tokenResult.error || '授权失败',
      });
    }

    const { accessToken, refreshToken, userId: alipayUserId, expiresAt, refreshExpiresAt } = tokenResult.data;
    const systemUserId = userId || 'default-user-id';

    // 检查是否已有授权记录
    const existing = await db
      .select()
      .from(alipayAuthTokens)
      .where(eq(alipayAuthTokens.userId, systemUserId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(alipayAuthTokens)
        .set({
          alipayUserId,
          accessToken,
          refreshToken,
          expiresAt,
          refreshExpiresAt,
        })
        .where(eq(alipayAuthTokens.userId, systemUserId));
    } else {
      await db.insert(alipayAuthTokens).values({
        userId: systemUserId,
        alipayUserId,
        accessToken,
        refreshToken,
        expiresIn: 0,
        reExpiresIn: 0,
        authTime: new Date(),
        expiresAt,
        refreshExpiresAt,
      });
    }

    res.json({
      success: true,
      data: { userId: alipayUserId },
    });
  } catch (error) {
    console.error('授权回调处理失败:', error);
    res.status(500).json({
      success: false,
      error: '授权回调处理失败',
    });
  }
});

/**
 * GET /api/alipay/status
 * 查询授权状态
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user-id';

    const result = await db
      .select()
      .from(alipayAuthTokens)
      .where(eq(alipayAuthTokens.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return res.json({
        success: true,
        data: { authorized: false },
      });
    }

    const token = result[0];
    const isExpired = new Date() > token.expiresAt;

    res.json({
      success: true,
      data: {
        authorized: !isExpired,
        expiresAt: token.expiresAt,
      },
    });
  } catch (error) {
    console.error('查询授权状态失败:', error);
    res.status(500).json({
      success: false,
      error: '查询授权状态失败',
    });
  }
});

/**
 * POST /api/alipay/bill/query
 * 兼容旧版户号查账接口
 */
router.post('/bill/query', async (req: Request, res: Response) => {
  try {
    const { billKey, chargeInst, billType, billDate } = req.body as {
      billKey?: string;
      chargeInst?: string;
      billType?: UtilityBillSubType;
      billDate?: string;
    };

    if (!billKey || !chargeInst || !billType || !['ELECTRIC', 'WATER'].includes(billType)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_UTILITY_BILL_QUERY',
        error: '请提供正确的户号、收费机构编码和缴费类型。',
      });
    }

    const result = await queryInstitutionBill({
      billKey,
      chargeInst,
      subBizType: billType,
      billDate,
    });

    if (!result.success) {
      const status = result.code === 'ALIPAY_UTILITY_BILLING_NOT_ENABLED' ? 403 : 502;
      return res.status(status).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('支付宝生活缴费查询失败:', error);
    return res.status(500).json({
      success: false,
      code: 'ALIPAY_UTILITY_BILL_QUERY_FAILED',
      error: error instanceof Error ? error.message : '支付宝生活缴费查询失败',
    });
  }
});

/**
 * GET /api/alipay/charge-insts
 * 兼容旧版收费机构列表接口
 */
router.get('/charge-insts', (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    code: 'ALIPAY_CHARGE_INST_LIST_UNAVAILABLE',
    error: '收费机构编码由获批的生活缴费机构接入方案提供，平台不再使用预置模拟编码。',
  });
});

export default router;
