/**
 * 开发环境配置
 * 适用于沙箱/Coze环境
 */

const devConfig = {
  // 环境标识
  env: 'development',
  
  // API 配置
  api: {
    baseUrl: process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000',
    prefix: '/api',
    timeout: 30000,
  },
  
  // 存储配置
  storage: {
    // 上传地址
    uploadUrl: '/api/storage/upload',
    // 预签名URL有效期（秒）
    presignedUrlExpiry: 3600,
    // 最大文件大小（字节）
    maxFileSize: 5 * 1024 * 1024, // 5MB
    // 允许的文件类型
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  },
  
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // 跨域配置
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  
  // 前端配置
  frontend: {
    // 静态资源基础路径
    assetPrefix: '/',
    // 图片加载占位符
    imagePlaceholder: '/placeholder.png',
  },
  
  // 调试配置
  debug: {
    enabled: true,
    logLevel: 'debug',
  },
};

export default devConfig;
