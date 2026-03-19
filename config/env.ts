/**
 * 统一环境配置模块
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
  
  // API 配置
  api: {
    baseUrl: string;
    port: number;
  };
  
  // 前端配置
  frontend: {
    baseUrl: string;
    port: number;
  };
  
  // 支付宝配置
  alipay: {
    appId: string;
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
 * 
 * 方案一：沙箱与生产完全一致
 * - 沙箱和生产使用同一个数据库 pi_cube
 * - 代码完全一致，无需切换
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  const isSandbox = env === 'sandbox';
  const isProduction = env === 'production';
  
  // 数据库配置：沙箱和生产使用同一个数据库
  const dbName = 'pi_cube';
  
  // 数据库密码从环境变量读取（敏感信息不硬编码）
  const dbPassword = process.env.PG_PASSWORD || process.env.DB_PASSWORD || '';
  
  // API 基础 URL
  let apiBaseUrl: string;
  
  if (typeof window !== 'undefined') {
    // 客户端
    const { protocol, hostname, port } = window.location;
    
    if (isSandbox) {
      // 沙箱环境：调用同沙箱的后端
      apiBaseUrl = `${protocol}//${hostname}:4001`;
    } else if (!port || port === '80' || port === '443') {
      // 生产环境：通过域名访问（无端口）→ 使用 Nginx 代理
      apiBaseUrl = `${protocol}//${hostname}/api`;
    } else {
      // 生产环境：通过 IP:端口访问 → 使用同 IP 的 4001 端口
      apiBaseUrl = `${protocol}//${hostname}:4001`;
    }
  } else {
    // 服务端
    if (isSandbox) {
      // 沙箱环境：调用本地后端
      apiBaseUrl = 'http://localhost:4001';
    } else {
      // 生产环境：调用本地后端
      apiBaseUrl = 'http://localhost:4001';
    }
  }
  
  // 前端基础 URL
  let frontendBaseUrl: string;
  
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    frontendBaseUrl = `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
  } else {
    const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
    if (isSandbox) {
      frontendBaseUrl = domain ? `https://${domain}` : 'http://localhost:5000';
    } else {
      frontendBaseUrl = domain ? `https://${domain}` : 'http://localhost:4000';
    }
  }
  
  // 支付宝回调地址
  const alipayRedirectUri = isSandbox
    ? `${frontendBaseUrl}/api/alipay/callback`
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
    
    api: {
      baseUrl: apiBaseUrl,
      port: 4001,
    },
    
    frontend: {
      baseUrl: frontendBaseUrl,
      port: isSandbox ? 5000 : 4000,
    },
    
    alipay: {
      appId: '2021006137617668',
      redirectUri: alipayRedirectUri,
    },
  };
}

// 导出单例配置
export const config = getEnvironmentConfig();

// 便捷方法
export const isSandbox = () => config.isSandbox;
export const isProduction = () => config.isProduction;
