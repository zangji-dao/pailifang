/**
 * 分润控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, profitShares, eq, desc, and, sql } from '../database/client';

export const profitShareController = {
  /**
   * 获取分润列表
   */
  async getProfitShares(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const period = req.query.period as string;
      const salesId = req.query.salesId as string;
      const accountantId = req.query.accountantId as string;

      const offset = (page - 1) * pageSize;

      // 构建查询条件
      const conditions = [];
      if (status) conditions.push(eq(profitShares.status, status));
      if (period) conditions.push(eq(profitShares.period, period));
      if (salesId) conditions.push(eq(profitShares.salesId, salesId));
      if (accountantId) conditions.push(eq(profitShares.accountantId, accountantId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const data = await db
        .select()
        .from(profitShares)
        .where(whereClause)
        .orderBy(desc(profitShares.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(profitShares)
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
      console.error('获取分润列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取分润列表失败',
      });
    }
  },

  /**
   * 创建分润记录
   */
  async createProfitShare(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await db
        .insert(profitShares)
        .values({
          customerId: body.customerId,
          ledgerId: body.ledgerId,
          salesId: body.salesId,
          accountantId: body.accountantId,
          profitRuleId: body.profitRuleId,
          totalAmount: body.totalAmount,
          salesAmount: body.salesAmount,
          accountantAmount: body.accountantAmount,
          period: body.period,
          status: body.status || 'pending',
          notes: body.notes,
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
        message: '创建分润记录成功',
      });
    } catch (error) {
      console.error('创建分润记录失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建分润记录失败',
      });
    }
  },

  /**
   * 更新分润状态
   */
  async updateProfitShare(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const result = await db
        .update(profitShares)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(profitShares.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '分润记录不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新分润失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新分润失败',
      });
    }
  },
};
