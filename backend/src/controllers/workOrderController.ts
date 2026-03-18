/**
 * 工单控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, workOrders, eq, desc, and, sql } from '../database/client';

export const workOrderController = {
  /**
   * 获取工单列表
   */
  async getWorkOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const assignedTo = req.query.assignedTo as string;

      const offset = (page - 1) * pageSize;

      // 构建查询条件
      const conditions = [];
      if (status) conditions.push(eq(workOrders.status, status));
      if (priority) conditions.push(eq(workOrders.priority, priority));
      if (assignedTo) conditions.push(eq(workOrders.assignedTo, assignedTo));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const data = await db
        .select()
        .from(workOrders)
        .where(whereClause)
        .orderBy(desc(workOrders.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(workOrders)
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
      console.error('获取工单列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取工单列表失败',
      });
    }
  },

  /**
   * 创建工单
   */
  async createWorkOrder(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await db
        .insert(workOrders)
        .values({
          title: body.title,
          type: body.type,
          description: body.description,
          customerId: body.customerId,
          ledgerId: body.ledgerId,
          assignedTo: body.assignedTo,
          createdBy: body.createdBy,
          priority: body.priority || 'medium',
          status: body.status || 'pending',
          dueDate: body.dueDate,
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
        message: '创建工单成功',
      });
    } catch (error) {
      console.error('创建工单失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建工单失败',
      });
    }
  },

  /**
   * 更新工单
   */
  async updateWorkOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const result = await db
        .update(workOrders)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(workOrders.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '工单不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新工单失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新工单失败',
      });
    }
  },

  /**
   * 删除工单
   */
  async deleteWorkOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .delete(workOrders)
        .where(eq(workOrders.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '工单不存在',
        });
      }

      return res.json({
        success: true,
        message: '工单已删除',
      });
    } catch (error) {
      console.error('删除工单失败:', error);
      return res.status(500).json({
        success: false,
        error: '删除工单失败',
      });
    }
  },
};
