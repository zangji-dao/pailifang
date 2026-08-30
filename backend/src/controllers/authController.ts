/**
 * 认证控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, users, eq, and, organizations, organizationMembers, roles, memberRoles } from '../database/client';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../services/password';
import { createSession, revokeSession, switchSessionOrganization } from '../services/session';
import {
  acceptAccountInvitation,
  AccountInvitationError,
  getInvitationDetails,
} from '../services/accountInvitation';

function publicUser<T extends { password: string }>(user: T) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export const authController = {
  /**
   * 用户登录
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: '邮箱和密码不能为空',
        });
      }

      // 查询用户
      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.isActive, true)))
        .limit(1);

      const userData = result[0];

      if (!userData) {
        return res.status(401).json({
          success: false,
          error: '用户不存在或已被禁用',
        });
      }

      const passwordResult = verifyPassword(password, userData.password);
      if (!passwordResult.valid) {
        return res.status(401).json({
          success: false,
          error: '密码错误',
        });
      }

      if (passwordResult.needsUpgrade) {
        await db
          .update(users)
          .set({ password: hashPassword(password), updatedAt: new Date() })
          .where(eq(users.id, userData.id));
      }

      const session = await createSession(userData.id);

      return res.json({
        success: true,
        data: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error('登录错误:', error);
      return res.status(500).json({
        success: false,
        error: '登录失败，请稍后重试',
      });
    }
  },

  /**
   * 用户注册
   */
  async register(req: Request, res: Response) {
    try {
      if (process.env.PUBLIC_REGISTRATION_ENABLED !== 'true') {
        return res.status(403).json({
          success: false,
          error: '公开注册已关闭，请联系组织管理员创建账号',
        });
      }

      const { email, password, name, phone } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: '邮箱、密码和姓名不能为空',
        });
      }

      // 检查邮箱是否已存在
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: '该邮箱已被注册',
        });
      }

      // 创建用户
      const result = await db
        .insert(users)
        .values({
          email,
          password: hashPassword(password),
          name,
          role: 'customer',
          phone,
        })
        .returning();

      const newUser = result[0];
      const platformRows = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.code, 'platform')).limit(1);
      const defaultRoleRows = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'platform_staff')).limit(1);

      if (platformRows[0] && defaultRoleRows[0]) {
        const membershipRows = await db
          .insert(organizationMembers)
          .values({ organizationId: platformRows[0].id, userId: newUser.id })
          .returning({ id: organizationMembers.id });

        if (membershipRows[0]) {
          await db.insert(memberRoles).values({
            memberId: membershipRows[0].id,
            roleId: defaultRoleRows[0].id,
            scopeType: 'organization',
            scopeId: platformRows[0].id,
          });
        }
      }

      const session = await createSession(newUser.id);

      return res.json({
        success: true,
        data: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error('注册错误:', error);
      return res.status(500).json({
        success: false,
        error: '注册失败，请稍后重试',
      });
    }
  },

  async invitation(req: Request, res: Response) {
    try {
      const data = await getInvitationDetails(req.params.token);
      return res.json({ success: true, data });
    } catch (error) {
      if (error instanceof AccountInvitationError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error('获取账号邀请失败:', error);
      return res.status(500).json({ success: false, error: '邀请信息加载失败' });
    }
  },

  async acceptInvitation(req: Request, res: Response) {
    try {
      const session = await acceptAccountInvitation(
        req.params.token,
        typeof req.body.password === 'string' ? req.body.password : undefined,
      );
      return res.json({
        success: true,
        data: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      if (error instanceof AccountInvitationError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error('接受账号邀请失败:', error);
      return res.status(500).json({ success: false, error: '账号激活失败，请稍后重试' });
    }
  },

  async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    return res.json({ success: true, data: req.user });
  },

  async switchContext(req: AuthRequest, res: Response) {
    const { organizationId } = req.body;
    if (!req.user || !req.sessionId || !organizationId) {
      return res.status(400).json({ success: false, error: '组织参数不完整' });
    }

    const user = await switchSessionOrganization(req.sessionId, req.user.id, organizationId);
    if (!user) {
      return res.status(403).json({ success: false, error: '当前账号不属于该组织' });
    }

    return res.json({ success: true, data: user });
  },

  async logout(req: AuthRequest, res: Response) {
    if (req.sessionId) await revokeSession(req.sessionId);
    return res.json({ success: true });
  },
};
