/**
 * 认证控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, users, eq, and } from '../database/client';

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

      // 简单密码验证（实际项目中应该使用 bcrypt 等）
      if (userData.password !== password) {
        return res.status(401).json({
          success: false,
          error: '密码错误',
        });
      }

      // 返回用户信息（不返回密码）
      const { password: _, ...userWithoutPassword } = userData;

      return res.json({
        success: true,
        data: userWithoutPassword,
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
      const { email, password, name, role = 'accountant', phone } = req.body;

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
          password,
          name,
          role,
          phone,
        })
        .returning();

      const newUser = result[0];

      // 返回用户信息（不返回密码）
      const { password: _, ...userWithoutPassword } = newUser;

      return res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('注册错误:', error);
      return res.status(500).json({
        success: false,
        error: '注册失败，请稍后重试',
      });
    }
  },
};
