/**
 * 科目控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, chartOfAccounts, eq, and, or, like, isNull, asc } from '../database/client';

export const accountController = {
  /**
   * 获取科目列表
   */
  async getAccounts(req: Request, res: Response) {
    try {
      const ledgerId = req.query.ledgerId as string;
      const type = req.query.type as string;
      const parentId = req.query.parentId as string;
      const isActive = req.query.isActive as string;
      const search = req.query.search as string;

      // 构建查询条件
      const conditions = [];
      if (ledgerId) conditions.push(eq(chartOfAccounts.ledgerId, ledgerId));
      if (type) conditions.push(eq(chartOfAccounts.type, type));
      if (parentId !== undefined) {
        if (parentId === 'null' || parentId === '') {
          conditions.push(isNull(chartOfAccounts.parentId));
        } else {
          conditions.push(eq(chartOfAccounts.parentId, parentId));
        }
      }
      if (isActive !== undefined) {
        conditions.push(eq(chartOfAccounts.isActive, isActive === 'true'));
      }
      if (search) {
        conditions.push(
          or(
            like(chartOfAccounts.code, `%${search}%`),
            like(chartOfAccounts.name, `%${search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select()
        .from(chartOfAccounts)
        .where(whereClause)
        .orderBy(asc(chartOfAccounts.code));

      return res.json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      console.error('获取科目列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取科目列表失败',
      });
    }
  },

  /**
   * 创建科目
   */
  async createAccount(req: Request, res: Response) {
    try {
      const body = req.body;

      // 检查编码是否已存在
      const existing = await db
        .select()
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.ledgerId, body.ledgerId),
            eq(chartOfAccounts.code, body.code)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '科目编码已存在',
        });
      }

      // 计算科目层级
      let level = 1;
      if (body.parentId) {
        const parent = await db
          .select()
          .from(chartOfAccounts)
          .where(eq(chartOfAccounts.id, body.parentId))
          .limit(1);

        if (parent.length > 0) {
          level = (parent[0].level || 1) + 1;

          // 更新父节点为非叶子节点
          await db
            .update(chartOfAccounts)
            .set({ isLeaf: false })
            .where(eq(chartOfAccounts.id, body.parentId));
        }
      }

      const result = await db
        .insert(chartOfAccounts)
        .values({
          ledgerId: body.ledgerId,
          code: body.code,
          name: body.name,
          parentId: body.parentId || null,
          level,
          type: body.type,
          direction: body.direction,
          isLeaf: true,
          isActive: body.isActive ?? true,
          remark: body.remark || null,
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
        message: '创建科目成功',
      });
    } catch (error) {
      console.error('创建科目失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建科目失败',
      });
    }
  },

  /**
   * 更新科目
   */
  async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '缺少科目ID',
        });
      }

      // 检查科目是否存在
      const existing = await db
        .select()
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '科目不存在',
        });
      }

      const existingAccount = existing[0];

      // 如果是系统预设科目（一级科目），只允许修改状态
      if (existingAccount.level === 1) {
        const allowedUpdate: Record<string, unknown> = {};

        if (body.isActive !== undefined) {
          allowedUpdate.isActive = body.isActive;
        }
        if (body.remark !== undefined) {
          allowedUpdate.remark = body.remark;
        }

        await db
          .update(chartOfAccounts)
          .set(allowedUpdate)
          .where(eq(chartOfAccounts.id, id));

        return res.json({
          success: true,
          message: '更新科目成功',
        });
      }

      // 明细科目可以修改更多信息
      const dataToUpdate: Record<string, unknown> = {};
      if (body.name !== undefined) dataToUpdate.name = body.name;
      if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;
      if (body.remark !== undefined) dataToUpdate.remark = body.remark;

      await db
        .update(chartOfAccounts)
        .set(dataToUpdate)
        .where(eq(chartOfAccounts.id, id));

      return res.json({
        success: true,
        message: '更新科目成功',
      });
    } catch (error) {
      console.error('更新科目失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新科目失败',
      });
    }
  },

  /**
   * 删除科目
   */
  async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '缺少科目ID',
        });
      }

      // 检查科目是否存在
      const existing = await db
        .select()
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '科目不存在',
        });
      }

      const existingAccount = existing[0];

      // 一级科目不允许删除
      if (existingAccount.level === 1) {
        return res.status(400).json({
          success: false,
          error: '系统预设科目不允许删除',
        });
      }

      // 检查是否有下级科目
      const children = await db
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.parentId, id));

      if (children.length > 0) {
        return res.status(400).json({
          success: false,
          error: '存在下级科目，无法删除',
        });
      }

      await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));

      return res.json({
        success: true,
        message: '删除科目成功',
      });
    } catch (error) {
      console.error('删除科目失败:', error);
      return res.status(500).json({
        success: false,
        error: '删除科目失败',
      });
    }
  },
};
