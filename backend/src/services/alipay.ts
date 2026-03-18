/**
 * 支付宝服务
 */

import { AlipaySdk } from 'alipay-sdk';

// 支付宝配置
const getAlipayConfig = () => ({
  appId: process.env.ALIPAY_APPID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: 'https://openapi.alipay.com/gateway.do',
  redirectUri: process.env.ALIPAY_REDIRECT_URI || '',
});

// SDK 实例缓存
let alipayClient: AlipaySdk | null = null;

export function getAlipayClient(): AlipaySdk {
  if (!alipayClient) {
    const config = getAlipayConfig();
    if (!config.appId || !config.privateKey || !config.alipayPublicKey) {
      throw new Error('支付宝配置不完整');
    }
    alipayClient = new AlipaySdk({
      appId: config.appId,
      privateKey: config.privateKey,
      alipayPublicKey: config.alipayPublicKey,
      gateway: config.gateway,
    });
  }
  return alipayClient;
}

export function isAlipayConfigured(): boolean {
  const config = getAlipayConfig();
  return !!(config.appId && config.privateKey && config.alipayPublicKey);
}

// 缴费类型
export enum BillType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
}

// 缴费机构编码
export const ChargeInstCodes = {
  JILIN_ELECTRICITY: '1002001001001',
  SONGYUAN_WATER: '1003001001001',
};

// 生成授权链接
export function generateAuthUrl(redirectUri?: string): string {
  const config = getAlipayConfig();
  const redirect = encodeURIComponent(redirectUri || config.redirectUri);
  return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${config.appId}&scope=auth_user&redirect_uri=${redirect}`;
}

// 用授权码换取访问令牌
export async function exchangeToken(authCode: string) {
  const client = getAlipayClient();

  const result = await client.exec('alipay.system.oauth.token', {
    grant_type: 'authorization_code',
    code: authCode,
  });

  if (result.code === '10000' || result.access_token) {
    const now = new Date();
    const expiresIn = parseInt(result.expires_in) || 86400;
    const refreshExpiresIn = parseInt(result.re_ex_expires_in) || 2592000;

    return {
      success: true,
      data: {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        userId: result.user_id,
        expiresAt: new Date(now.getTime() + expiresIn * 1000),
        refreshExpiresAt: new Date(now.getTime() + refreshExpiresIn * 1000),
      },
    };
  }

  return {
    success: false,
    error: result.msg || result.sub_msg || '换取令牌失败',
  };
}

// 查询账单
export async function queryBill(params: {
  billKey: string;
  chargeInst: string;
  billType: BillType;
}) {
  const client = getAlipayClient();

  const result = await client.exec('alipay.ebpp.bill.get', {
    bill_key: params.billKey,
    charge_inst: params.chargeInst,
    bill_type: params.billType,
  });

  if (result.code === '10000') {
    return {
      success: true,
      data: result.bill_infos || [],
    };
  }

  return {
    success: false,
    error: result.msg || result.sub_msg || '查询失败',
  };
}

// 获取用户信息
export async function getUserInfo(authToken: string) {
  const client = getAlipayClient();

  const result = await client.exec('alipay.user.info.share', {
    auth_token: authToken,
  });

  if (result.code === '10000') {
    return {
      success: true,
      data: {
        userId: result.user_id,
        avatar: result.avatar,
        nickName: result.nick_name,
      },
    };
  }

  return {
    success: false,
    error: result.msg || result.sub_msg || '获取用户信息失败',
  };
}
