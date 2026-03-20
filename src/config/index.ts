/**
 * 配置入口
 * 根据环境自动切换配置文件
 */

import devConfig from './config.dev';
import prodConfig from './config.prod';

export type AppConfig = typeof devConfig;

/**
 * 获取当前环境配置
 * - development → 沙箱/Coze环境
 * - production  → 生产环境
 */
const getConfig = (): AppConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return prodConfig;
  }
  
  return devConfig;
};

const config = getConfig();

export default config;

// 导出常用配置快捷访问
export const apiBaseUrl = config.api.baseUrl;
export const apiPrefix = config.api.prefix;
export const uploadUrl = config.storage.uploadUrl;
export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
