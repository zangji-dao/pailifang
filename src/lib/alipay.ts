import { AlipaySdk } from 'alipay-sdk';

// 支付宝配置
const alipayConfig = {
  appId: process.env.ALIPAY_APPID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: 'https://openapi.alipay.com/gateway.do',
  // 授权回调地址
  redirectUri: process.env.ALIPAY_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/alipay/callback`,
};

// 创建支付宝SDK实例
let alipayClient: AlipaySdk | null = null;

export function getAlipayClient(): AlipaySdk {
  if (!alipayClient) {
    if (!alipayConfig.appId || !alipayConfig.privateKey || !alipayConfig.alipayPublicKey) {
      throw new Error('支付宝配置不完整，请检查环境变量 ALIPAY_APPID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY');
    }
    alipayClient = new AlipaySdk({
      appId: alipayConfig.appId,
      privateKey: alipayConfig.privateKey,
      alipayPublicKey: alipayConfig.alipayPublicKey,
      gateway: alipayConfig.gateway,
    });
  }
  return alipayClient;
}

// 检查支付宝配置是否完整
export function isAlipayConfigured(): boolean {
  return !!(alipayConfig.appId && alipayConfig.privateKey && alipayConfig.alipayPublicKey);
}

// 缴费类型枚举
export enum BillType {
  ELECTRICITY = 'ELECTRICITY', // 电费
  WATER = 'WATER', // 水费
  GAS = 'GAS', // 燃气费
}

// 缴费机构编码（吉林省松原市）
export const ChargeInstCodes = {
  // 国家电网 - 吉林省电力有限公司
  JILIN_ELECTRICITY: '1002001001001',
  // 松原市自来水公司
  SONGYUAN_WATER: '1003001001001',
};

// 账单查询结果类型
export interface BillInfo {
  billKey: string; // 户号
  billDate: string; // 账单日期
  billAmount: string; // 账单金额
  billStatus: string; // 账单状态
  payload?: {
    ownerName?: string; // 户名
    address?: string; // 地址
  };
}

// 查询账单参数
export interface QueryBillParams {
  billKey: string; // 户号
  chargeInst: string; // 缴费机构编码
  billType: BillType; // 缴费类型
}

/**
 * 查询生活缴费账单
 * 文档: https://opendocs.alipay.com/open/02hd36
 */
export async function queryBill(params: QueryBillParams): Promise<{
  success: boolean;
  data?: BillInfo[];
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    // 支付宝SDK exec方法直接传递业务参数，不需要手动JSON.stringify
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
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '查询失败',
      };
    }
  } catch (error) {
    console.error('查询账单失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
    };
  }
}

/**
 * 缴费支付
 * 文档: https://opendocs.alipay.com/open/fea30a1b_alipay.ebpp.pdeduct.pay
 */
export async function payBill(params: {
  billKey: string;
  chargeInst: string;
  billType: BillType;
  amount: string;
  agreementId?: string; // 签约协议号，如果用户已签约代扣
}): Promise<{
  success: boolean;
  data?: {
    orderId: string;
    payUrl?: string;
  };
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    const result = await client.exec('alipay.ebpp.pdeduct.pay', {
      bill_key: params.billKey,
      charge_inst: params.chargeInst,
      bill_type: params.billType,
      amount: params.amount,
      agreement_id: params.agreementId,
    });

    if (result.code === '10000') {
      return {
        success: true,
        data: {
          orderId: result.order_id,
          payUrl: result.pay_url,
        },
      };
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '支付失败',
      };
    }
  } catch (error) {
    console.error('缴费支付失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '支付失败',
    };
  }
}

// ==================== 用户授权相关 ====================

/**
 * 生成授权链接
 * 用于引导用户在支付宝进行授权
 * 文档: https://opendocs.alipay.com/open/218/105325
 */
export function generateAuthUrl(redirectUri?: string): string {
  const redirect = encodeURIComponent(redirectUri || alipayConfig.redirectUri);
  return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${alipayConfig.appId}&scope=auth_user&redirect_uri=${redirect}`;
}

/**
 * 用授权码换取访问令牌
 * 文档: https://opendocs.alipay.com/open/218/105328
 */
export async function exchangeToken(authCode: string): Promise<{
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  };
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    const result = await client.exec('alipay.system.oauth.token', {
      grant_type: 'authorization_code',
      code: authCode,
    });

    if (result.code === '10000' || result.access_token) {
      // 计算过期时间
      const now = new Date();
      // access_token 有效期1天（实际返回的是秒数）
      const expiresIn = parseInt(result.expires_in) || 86400; // 默认1天
      // refresh_token 有效期30天
      const refreshExpiresIn = parseInt(result.re_expires_in) || 2592000; // 默认30天

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
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '换取令牌失败',
      };
    }
  } catch (error) {
    console.error('换取令牌失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '换取令牌失败',
    };
  }
}

/**
 * 刷新访问令牌
 * 使用refresh_token获取新的access_token
 * 文档: https://opendocs.alipay.com/open/218/105328
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  };
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    const result = await client.exec('alipay.system.oauth.token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    if (result.code === '10000' || result.access_token) {
      const now = new Date();
      const expiresIn = parseInt(result.expires_in) || 86400;
      const refreshExpiresIn = parseInt(result.re_expires_in) || 2592000;

      return {
        success: true,
        data: {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresAt: new Date(now.getTime() + expiresIn * 1000),
          refreshExpiresAt: new Date(now.getTime() + refreshExpiresIn * 1000),
        },
      };
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '刷新令牌失败',
      };
    }
  } catch (error) {
    console.error('刷新令牌失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '刷新令牌失败',
    };
  }
}

/**
 * 使用用户授权令牌查询账单
 * 需要用户授权后才能调用
 * 文档: https://opendocs.alipay.com/open/02hd36
 */
export async function queryBillWithAuth(params: QueryBillParams & { authToken: string }): Promise<{
  success: boolean;
  data?: BillInfo[];
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    const result = await client.exec('alipay.ebpp.bill.get', {
      bill_key: params.billKey,
      charge_inst: params.chargeInst,
      bill_type: params.billType,
      auth_token: params.authToken, // 使用用户的授权令牌
    });

    if (result.code === '10000') {
      return {
        success: true,
        data: result.bill_infos || [],
      };
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '查询失败',
      };
    }
  } catch (error) {
    console.error('查询账单失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
    };
  }
}

/**
 * 获取支付宝用户信息
 * 文档: https://opendocs.alipay.com/open/218/105329
 */
export async function getUserInfo(authToken: string): Promise<{
  success: boolean;
  data?: {
    userId: string;
    avatar?: string;
    nickName?: string;
  };
  error?: string;
}> {
  const client = getAlipayClient();

  try {
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
    } else {
      return {
        success: false,
        error: result.msg || result.sub_msg || '获取用户信息失败',
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取用户信息失败',
    };
  }
}
