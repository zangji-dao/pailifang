/**
 * 账套控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, ledgers, eq, desc, sql, and } from '../database/client';

export const ledgerController = {
  /**
   * 获取账套列表
   */
  async getLedgers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const customerId = req.query.customerId as string;
      const accountantId = req.query.accountantId as string;

      const offset = (page - 1) * pageSize;

      // 构建查询条件
      const conditions = [];
      if (status) conditions.push(eq(ledgers.status, status));
      if (customerId) conditions.push(eq(ledgers.customerId, customerId));
      if (accountantId) conditions.push(eq(ledgers.accountantId, accountantId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const data = await db
        .select()
        .from(ledgers)
        .where(whereClause)
        .orderBy(desc(ledgers.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(ledgers)
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
      console.error('获取账套列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取账套列表失败',
      });
    }
  },

  /**
   * 创建账套
   */
  async createLedger(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await db
        .insert(ledgers)
        .values({
          name: body.name,
          customerId: body.customerId,
          accountantId: body.accountantId,
          year: body.year,
          status: body.status || 'active',
          description: body.description,
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建账套失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建账套失败',
      });
    }
  },

  /**
   * 获取账套详情
   */
  async getLedgerById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .select()
        .from(ledgers)
        .where(eq(ledgers.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '账套不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('获取账套详情失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取账套详情失败',
      });
    }
  },

  /**
   * 更新账套
   */
  async updateLedger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const result = await db
        .update(ledgers)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(ledgers.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '账套不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新账套失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新账套失败',
      });
    }
  },

  /**
   * 删除账套
   */
  async deleteLedger(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .delete(ledgers)
        .where(eq(ledgers.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '账套不存在',
        });
      }

      return res.json({
        success: true,
        message: '账套已删除',
      });
    } catch (error) {
      console.error('删除账套失败:', error);
      return res.status(500).json({
        success: false,
        error: '删除账套失败',
      });
    }
  },
};
