import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // TODO: 这里应该验证 JWT token
    // 暂时使用简化版本：token 直接是 userId
    if (!token || token.length < 10) {
      return res.status(401).json({ success: false, error: '无效的 token' });
    }

    // TODO: 从数据库验证用户信息
    // 暂时将 token 作为 userId 存入 req.user
    req.user = {
      id: token,
      email: '',
      name: '',
      role: '',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, error: '认证失败' });
  }
};

// 可选的认证中间件（不强制要求登录）
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && token.length >= 10) {
        req.user = {
          id: token,
          email: '',
          name: '',
          role: '',
        };
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
