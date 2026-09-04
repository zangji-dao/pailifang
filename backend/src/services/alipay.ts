/**
 * 支付宝服务
 */

import { AlipaySdk } from 'alipay-sdk';

export type AlipayEnvironment = 'production' | 'sandbox';

const ALIPAY_GATEWAYS: Record<AlipayEnvironment, string> = {
  production: 'https://openapi.alipay.com/gateway.do',
  sandbox: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
};

const getAlipayConfig = () => {
  const environment: AlipayEnvironment = process.env.ALIPAY_ENVIRONMENT === 'sandbox'
    ? 'sandbox'
    : 'production';
  const sandbox = environment === 'sandbox';

  return {
    environment,
    appId: sandbox
      ? process.env.ALIPAY_SANDBOX_APPID || process.env.ALIPAY_APPID || ''
      : process.env.ALIPAY_APPID || '',
    privateKey: sandbox
      ? process.env.ALIPAY_SANDBOX_PRIVATE_KEY || process.env.ALIPAY_PRIVATE_KEY || ''
      : process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: sandbox
      ? process.env.ALIPAY_SANDBOX_PUBLIC_KEY || process.env.ALIPAY_PUBLIC_KEY || ''
      : process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: ALIPAY_GATEWAYS[environment],
    redirectUri: process.env.ALIPAY_REDIRECT_URI || '',
  };
};

// SDK 实例缓存
let alipayClientCache: { key: string; client: AlipaySdk } | null = null;

export function getAlipayClient(): AlipaySdk {
  const config = getAlipayConfig();
  if (!config.appId || !config.privateKey || !config.alipayPublicKey) {
    throw new Error('支付宝配置不完整');
  }

  const cacheKey = `${config.environment}:${config.appId}:${config.gateway}`;
  if (!alipayClientCache || alipayClientCache.key !== cacheKey) {
    alipayClientCache = {
      key: cacheKey,
      client: new AlipaySdk({
        appId: config.appId,
        privateKey: config.privateKey,
        alipayPublicKey: config.alipayPublicKey,
        gateway: config.gateway,
      }),
    };
  }

  return alipayClientCache.client;
}

export function isAlipayConfigured(): boolean {
  const config = getAlipayConfig();
  return !!(config.appId && config.privateKey && config.alipayPublicKey);
}

export function getAlipayConfigurationStatus() {
  const config = getAlipayConfig();
  const configured = isAlipayConfigured();

  return {
    configured,
    environment: config.environment,
    appIdMasked: config.appId
      ? `${config.appId.slice(0, 4)}****${config.appId.slice(-4)}`
      : null,
    gateway: config.gateway,
    redirectUri: config.redirectUri || null,
  };
}

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
