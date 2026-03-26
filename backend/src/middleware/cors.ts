import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 允许的前端域名
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
  ];

  const origin = req.headers.origin;
  
  // 检查是否在白名单中，或者是同一 IP 的请求（支持 IP:端口 访问）
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    // 允许来自同一服务器的请求（IP 访问）
    origin.includes('://152.136.12.122') ||
    origin.includes('://localhost') ||
    origin.includes('://127.0.0.1') ||
    // 允许 Coze 沙箱域名
    origin.includes('dev.coze.site') ||
    // 允许生产域名
    origin.includes('pi.chemicaloop.com')
  );
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
