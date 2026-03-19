/**
 * 后端统一环境配置模块
 * 
 * 核心原则：
 * 1. 代码自动判断环境，无需手动配置
 * 2. 敏感信息通过系统环境变量注入
 * 3. 沙箱和生产环境使用同一份代码
 * 
 * 环境判断逻辑：
 * - COZE_PROJECT_ENV=DEV → 沙箱环境
 * - COZE_PROJECT_ENV=PROD → 生产环境
 * - COZE_PROJECT_DOMAIN_DEFAULT 包含 dev.coze.site → 沙箱环境
 * - 其他情况 → 生产环境
 */

// 环境类型
export type Environment = 'sandbox' | 'production';

// 环境配置接口
export interface EnvironmentConfig {
  // 环境标识
  env: Environment;
  isSandbox: boolean;
  isProduction: boolean;
  
  // 数据库配置
  database: {
    host: string;
    port: number;
    user: string;
    password: string;  // 从环境变量读取
    database: string;  // 沙箱用 pi_cube_dev，生产用 pi_cube
  };
  
  // 服务配置
  server: {
    port: number;
  };
  
  // 支付宝配置
  alipay: {
    appId: string;
    privateKey: string;  // 从环境变量读取
    publicKey: string;   // 从环境变量读取
    redirectUri: string;
  };
}

/**
 * 判断当前环境
 */
export function detectEnvironment(): Environment {
  // 优先使用 COZE_PROJECT_ENV
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
  
  // 数据库配置
  // 默认：沙箱环境使用 pi_cube_dev，生产环境使用 pi_cube
  // 如果设置了 USE_PROD_DB=true，沙箱也使用生产数据库（完全一致模式）
  const useProdDb = process.env.USE_PROD_DB === 'true';
  const dbName = isSandbox && !useProdDb ? 'pi_cube_dev' : 'pi_cube';
  
  // 从环境变量读取敏感信息
  const dbPassword = process.env.PG_PASSWORD || process.env.DB_PASSWORD || '';
  const alipayPrivateKey = process.env.ALIPAY_PRIVATE_KEY || '';
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY || '';
  
  // 支付宝回调地址
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  const alipayRedirectUri = isSandbox
    ? `https://${domain}/api/alipay/callback`
    : 'https://pi.chemicaloop.com/api/alipay/callback';
  
  return {
    env,
    isSandbox,
    isProduction,
    
    database: {
      host: '152.136.12.122',
      port: 5432,
      user: 'pi_user',
      password: dbPassword,
      database: dbName,
    },
    
    server: {
      port: parseInt(process.env.PORT || '4001', 10),
    },
    
    alipay: {
      appId: '2021006137617668',
      privateKey: alipayPrivateKey,
      publicKey: alipayPublicKey,
      redirectUri: alipayRedirectUri,
    },
  };
}

// 导出单例配置
export const config = getEnvironmentConfig();

// 便捷方法
export const isSandbox = () => config.isSandbox;
export const isProduction = () => config.isProduction;
