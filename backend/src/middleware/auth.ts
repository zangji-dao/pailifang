import { Request, Response, NextFunction } from 'express';
import { AccessUser, getSessionContext } from '../services/session';

export interface AuthRequest extends Request {
  user?: AccessUser;
  sessionId?: string;
  sessionTokenHash?: string;
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7).trim() || null;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    const session = await getSessionContext(token);
    if (!session) {
      return res.status(401).json({ success: false, error: '无效的 token' });
    }

    req.user = session.user;
    req.sessionId = session.sessionId;
    req.sessionTokenHash = session.tokenHash;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, error: '认证失败' });
  }
};

// 可选的认证中间件（不强制要求登录）
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (token) {
      const session = await getSessionContext(token);
      if (session) {
        req.user = session.user;
        req.sessionId = session.sessionId;
        req.sessionTokenHash = session.tokenHash;
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

export function requirePermission(...permissionCodes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    if (req.user.permissions.includes('platform.manage') || permissionCodes.some((code) => req.user?.permissions.includes(code))) {
      return next();
    }

    return res.status(403).json({ success: false, error: '当前账号无权执行此操作' });
  };
}
