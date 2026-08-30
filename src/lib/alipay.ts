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
  ELECTRICITY = 'ELECTRIC', // 电费
  WATER = 'WATER', // 水费
  GAS = 'GAS', // 燃气费
}

// 缴费机构编码必须由支付宝生活缴费业务方确认后配置
export const ChargeInstCodes = {
  JILIN_ELECTRICITY: '',
  SONGYUAN_WATER: '',
};

// 账单查询结果类型
export interface BillInfo {
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

// 查询账单参数
export interface QueryBillParams {
  billKey: string; // 户号
  chargeInst: string; // 缴费机构编码
  billType: BillType; // 缴费类型
  billDate?: string;
}

/**
 * 按收费机构和户号查询生活缴费账单及可用余额
 */
export async function queryBill(params: QueryBillParams): Promise<{
  success: boolean;
  data?: BillInfo[];
  error?: string;
}> {
  const client = getAlipayClient();

  try {
    const result = await client.exec('alipay.ebpp.jfexport.instbill.query', {
      biz_type: 'JF',
      sub_biz_type: params.billType,
      bill_key: params.billKey,
      charge_inst: params.chargeInst,
      ...(params.billDate ? { bill_date: params.billDate } : {}),
    });

    if (result.code === '10000') {
      const rawBills = result.inst_bills ?? result.instBills;
      const bills = Array.isArray(rawBills) ? rawBills : [];
      return {
        success: true,
        data: bills.map((bill: Record<string, unknown>) => {
          const readValue = (snakeCase: string, camelCase: string) => {
            const value = bill[snakeCase] ?? bill[camelCase];
            return value === undefined || value === null || value === '' ? null : String(value);
          };

          return {
            amount: readValue('amount', 'amount'),
            balance: readValue('balance', 'balance'),
            billDate: readValue('bill_date', 'billDate'),
            billKey: readValue('bill_key', 'billKey'),
            billStatus: readValue('bill_status', 'billStatus'),
            chargeInst: readValue('charge_inst', 'chargeInst'),
            chargeMode: readValue('charge_mode', 'chargeMode'),
            ownerName: readValue('owner_name', 'ownerName'),
            subBizType: readValue('sub_biz_type', 'subBizType'),
          };
        }),
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
 * 兼容旧调用方式；机构账单查询不向支付宝传递用户授权令牌
 */
export async function queryBillWithAuth(params: QueryBillParams & { authToken: string }): Promise<{
  success: boolean;
  data?: BillInfo[];
  error?: string;
}> {
  return queryBill(params);
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
