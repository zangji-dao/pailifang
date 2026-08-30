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
  utilityBillingEnabled: process.env.ALIPAY_UTILITY_BILLING_ENABLED === 'true',
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

export function getAlipayConfigurationStatus() {
  const config = getAlipayConfig();
  const configured = isAlipayConfigured();
  const utilityBillingEnabled = configured && config.utilityBillingEnabled;

  return {
    configured,
    appIdMasked: config.appId
      ? `${config.appId.slice(0, 4)}****${config.appId.slice(-4)}`
      : null,
    redirectUri: config.redirectUri || null,
    utilityBilling: {
      enabled: utilityBillingEnabled,
      status: utilityBillingEnabled ? 'enabled' : 'pending_authorization',
      mode: 'institution_bill_query',
      requiresInstitutionAgreement: true,
      message: utilityBillingEnabled
        ? '生活缴费户号查询已启用，可按收费机构实际返回同步账单及余额。'
        : '支付宝加签已完成，户号查询代码已就绪；还需开通生活缴费接口权限并配置收费机构编码。',
    },
  };
}

export type UtilityBillSubType = 'ELECTRIC' | 'WATER';

export interface InstitutionBill {
  amount: string | null;
  balance: string | null;
  billDate: string | null;
  billKey: string | null;
  billStatus: string | null;
  chargeInst: string | null;
  chargeMode: string | null;
  ownerName: string | null;
  subBizType: string | null;
}

function readResultValue(source: Record<string, unknown>, snakeCase: string, camelCase: string) {
  const value = source[snakeCase] ?? source[camelCase];
  return value === undefined || value === null || value === '' ? null : String(value);
}

export async function queryInstitutionBill(params: {
  billKey: string;
  chargeInst: string;
  subBizType: UtilityBillSubType;
  billDate?: string;
}) {
  const config = getAlipayConfig();
  if (!config.utilityBillingEnabled) {
    return {
      success: false as const,
      code: 'ALIPAY_UTILITY_BILLING_NOT_ENABLED',
      error: '当前应用尚未启用支付宝生活缴费户号查询权限。',
    };
  }

  const client = getAlipayClient();
  const result = await client.exec('alipay.ebpp.jfexport.instbill.query', {
    biz_type: 'JF',
    sub_biz_type: params.subBizType,
    bill_key: params.billKey,
    charge_inst: params.chargeInst,
    ...(params.billDate ? { bill_date: params.billDate } : {}),
  }) as Record<string, unknown>;

  const responseCode = String(result.code || '');
  if (responseCode !== '10000') {
    return {
      success: false as const,
      code: String(result.sub_code || result.subCode || responseCode || 'ALIPAY_QUERY_FAILED'),
      error: String(result.sub_msg || result.subMsg || result.msg || '支付宝生活缴费查询失败'),
    };
  }

  const rawBills = result.inst_bills ?? result.instBills;
  const billList = Array.isArray(rawBills) ? rawBills : [];
  const bills: InstitutionBill[] = billList
    .filter((bill): bill is Record<string, unknown> => !!bill && typeof bill === 'object')
    .map((bill) => ({
      amount: readResultValue(bill, 'amount', 'amount'),
      balance: readResultValue(bill, 'balance', 'balance'),
      billDate: readResultValue(bill, 'bill_date', 'billDate'),
      billKey: readResultValue(bill, 'bill_key', 'billKey'),
      billStatus: readResultValue(bill, 'bill_status', 'billStatus'),
      chargeInst: readResultValue(bill, 'charge_inst', 'chargeInst'),
      chargeMode: readResultValue(bill, 'charge_mode', 'chargeMode'),
      ownerName: readResultValue(bill, 'owner_name', 'ownerName'),
      subBizType: readResultValue(bill, 'sub_biz_type', 'subBizType'),
    }));

  return {
    success: true as const,
    data: {
      billKey: params.billKey,
      chargeInst: params.chargeInst,
      subBizType: params.subBizType,
      bills,
      balance: bills.find((bill) => bill.balance !== null)?.balance ?? null,
      amount: bills.find((bill) => bill.amount !== null)?.amount ?? null,
    },
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
