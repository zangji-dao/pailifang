import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse } from '../utils/response';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json(errorResponse('邮箱和密码不能为空'));
      }

      const client = getSupabaseClient();

      // 查询用户
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        return res.status(401).json(errorResponse('用户不存在或已被禁用'));
      }

      // 简单密码验证（实际项目中应该使用 bcrypt 等）
      if (userData.password !== password) {
        return res.status(401).json(errorResponse('密码错误'));
      }

      // 返回用户信息（不返回密码）
      const { password: _, ...userWithoutPassword } = userData;

      return res.json(successResponse(userWithoutPassword, '登录成功'));
    } catch (error) {
      console.error('登录错误:', error);
      return res.status(500).json(errorResponse('登录失败，请稍后重试'));
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role = 'accountant', phone } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json(errorResponse('邮箱、密码和姓名不能为空'));
      }

      const client = getSupabaseClient();

      // 检查邮箱是否已存在
      const { data: existingUser } = await client
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json(errorResponse('该邮箱已被注册'));
      }

      // 创建用户
      const { data: newUser, error: insertError } = await client
        .from('users')
        .insert({
          email,
          password,
          name,
          role,
          phone,
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('创建用户失败:', insertError);
        return res.status(500).json(errorResponse('创建用户失败'));
      }

      // 返回用户信息（不返回密码）
      const { password: _, ...userWithoutPassword } = newUser;

      return res.json(successResponse(userWithoutPassword, '注册成功'));
    } catch (error) {
      console.error('注册错误:', error);
      return res.status(500).json(errorResponse('注册失败，请稍后重试'));
    }
  },
};
