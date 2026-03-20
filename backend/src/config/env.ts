/**
 * 后端统一环境配置模块
 * 
 * 使用 Coze 平台提供的服务：
 * - 数据库：Supabase (COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY)
 * - 对象存储：Coze S3 (COZE_BUCKET_ENDPOINT_URL, COZE_BUCKET_NAME)
 * 
 * 环境判断逻辑：
 * - COZE_PROJECT_ENV=DEV → 沙箱环境
 * - COZE_PROJECT_ENV=PROD → 生产环境
 */

// 环境类型
export type Environment = 'sandbox' | 'production';

// 环境配置接口
export interface EnvironmentConfig {
  // 环境标识
  env: Environment;
  isSandbox: boolean;
  isProduction: boolean;
  
  // 服务配置
  server: {
    port: number;
    bodyLimit: string; // 请求体大小限制
  };
  
  // 支付宝配置
  alipay: {
    appId: string;
    privateKey: string;
    publicKey: string;
    redirectUri: string;
  };
  
  // 萤石云配置
  ysWith: {
    appKey: string;
    appSecret: string;
  };
}

/**
 * 判断当前环境
 */
export function detectEnvironment(): Environment {
  const projectEnv = process.env.COZE_PROJECT_ENV;
  if (projectEnv === 'DEV') {
    return 'sandbox';
  }
  if (projectEnv === 'PROD') {
    return 'production';
  }
  
  // 其次通过域名判断
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  if (domain.includes('dev.coze.site')) {
    return 'sandbox';
  }
  
  // 默认为生产环境
  return 'production';
}

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  const isSandbox = env === 'sandbox';
  const isProduction = env === 'production';
  
  console.log(`[环境] 当前环境: ${env}`);
  console.log(`[环境] 服务端口: ${process.env.PORT || 4001}`);
  
  // 支付宝配置
  const alipayPrivateKey = process.env.ALIPAY_PRIVATE_KEY || '';
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY || '';
  
  // 萤石云配置
  const ysWithAppKey = process.env.YSWITH_APP_KEY || 'a3f88c0e03f6480cbb0e2aa20f27a897';
  const ysWithAppSecret = process.env.YSWITH_APP_SECRET || '9209c4a91da554130c78d0d7a9cddff0';
  
  // 支付宝回调地址
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  const alipayRedirectUri = isSandbox
    ? `https://${domain}/api/alipay/callback`
    : 'https://pi.chemicaloop.com/api/alipay/callback';
  
  return {
    env,
    isSandbox,
    isProduction,
    
    server: {
      port: parseInt(process.env.PORT || '4001', 10),
      bodyLimit: process.env.BODY_LIMIT || '50mb', // 请求体大小限制，可通过环境变量配置
    },
    
    alipay: {
      appId: '2021006137617668',
      privateKey: alipayPrivateKey,
      publicKey: alipayPublicKey,
      redirectUri: alipayRedirectUri,
    },
    
    ysWith: {
      appKey: ysWithAppKey,
      appSecret: ysWithAppSecret,
    },
  };
}

// 导出单例配置
export const config = getEnvironmentConfig();

// 便捷方法
export const isSandbox = () => config.isSandbox;
export const isProduction = () => config.isProduction;
