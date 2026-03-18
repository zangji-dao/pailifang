/**
 * 客户控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, customers, eq, or, like, desc, sql, and } from '../database/client';

export const customerController = {
  /**
   * 获取客户列表
   */
  async getCustomers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const offset = (page - 1) * pageSize;

      // 构建查询条件
      const conditions = [];
      if (status) {
        conditions.push(eq(customers.status, status));
      }
      if (search) {
        conditions.push(
          or(
            like(customers.name, `%${search}%`),
            like(customers.contactPerson, `%${search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const data = await db
        .select()
        .from(customers)
        .where(whereClause)
        .orderBy(desc(customers.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(customers)
        .where(whereClause);
      const total = Number(countResult[0]?.count) || 0;

      return res.json({
        success: true,
        data,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('获取客户列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取客户列表失败',
      });
    }
  },

  /**
   * 创建客户
   */
  async createCustomer(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await db
        .insert(customers)
        .values({
          name: body.name,
          contactPerson: body.contactPerson,
          contactPhone: body.contactPhone,
          email: body.email,
          address: body.address,
          salesId: body.salesId,
          status: body.status || 'potential',
          notes: body.notes,
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建客户失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建客户失败',
      });
    }
  },

  /**
   * 获取客户详情
   */
  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '客户不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('获取客户详情失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取客户详情失败',
      });
    }
  },

  /**
   * 更新客户
   */
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const result = await db
        .update(customers)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '客户不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新客户失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新客户失败',
      });
    }
  },

  /**
   * 删除客户
   */
  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '客户不存在',
        });
      }

      return res.json({
        success: true,
        message: '客户已删除',
      });
    } catch (error) {
      console.error('删除客户失败:', error);
      return res.status(500).json({
        success: false,
        error: '删除客户失败',
      });
    }
  },
};
