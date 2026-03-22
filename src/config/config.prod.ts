/**
 * 生产环境配置
 * 适用于正式部署环境
 */

import type { AppConfig } from './types';

const prodConfig: AppConfig = {
  // 环境标识
  env: 'production',

  // API 配置
  api: {
    // 前端 API 路由（Next.js API Routes）
    baseUrl: process.env.COZE_PROJECT_DOMAIN_DEFAULT || '',
    prefix: '/api',
    timeout: 15000,
  },

  // 后端 API 配置（独立后端服务）
  backend: {
    // 后端服务地址（生产环境通过 Nginx 代理）
    baseUrl: process.env.BACKEND_URL || 'http://localhost:4001',
    prefix: '/api',
    timeout: 15000,
  },

  // 存储配置
  storage: {
    uploadUrl: '/api/storage/upload',
    presignedUrlExpiry: 3600,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN || '',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // 前端配置
  frontend: {
    assetPrefix: '/',
    imagePlaceholder: '/placeholder.png',
  },

  // 调试配置
  debug: {
    enabled: false,
    logLevel: 'error',
  },

  // 地图配置
  map: {
    // 高德地图 API Key（从环境变量获取）
    amapKey: process.env.AMAP_KEY || '',
    // 默认中心点：长春市
    defaultCenterLng: 125.3245,
    defaultCenterLat: 43.8868,
    defaultZoom: 12,
  },
};

export default prodConfig;
