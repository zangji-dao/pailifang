import { Request, Response } from 'express';
import { db } from '../database/client';
import { enterprises } from '../database/schema';
import { eq, sql } from 'drizzle-orm';

export const enterpriseController = {
  /**
   * 获取企业统计
   */
  async getStats(req: Request, res: Response) {
    try {
      // 统计各类型企业数量
      const tenantCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enterprises)
        .where(eq(enterprises.type, 'tenant'));

      const serviceCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enterprises)
        .where(eq(enterprises.type, 'service'));

      const activeCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enterprises)
        .where(eq(enterprises.status, 'active'));

      res.json({
        success: true,
        data: {
          total: (tenantCount[0]?.count || 0) + (serviceCount[0]?.count || 0),
          tenant: tenantCount[0]?.count || 0,
          service: serviceCount[0]?.count || 0,
          active: activeCount[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error('获取企业统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取企业统计失败',
      });
    }
  },

  /**
   * 获取企业列表
   */
  async getEnterprises(req: Request, res: Response) {
    try {
      const { type, status } = req.query;

      let query = db.select().from(enterprises);

      const results = await db.select().from(enterprises);

      let filtered = results;
      if (type) {
        filtered = filtered.filter(e => e.type === type);
      }
      if (status) {
        filtered = filtered.filter(e => e.status === status);
      }

      res.json({
        success: true,
        data: filtered,
      });
    } catch (error) {
      console.error('获取企业列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取企业列表失败',
      });
    }
  },

  /**
   * 创建企业
   */
  async createEnterprise(req: Request, res: Response) {
    try {
      const { name, creditCode, legalPerson, phone, industry, type, status, registeredAddress, businessAddress, settledDate, remarks } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: '企业名称不能为空',
        });
      }

      const result = await db.insert(enterprises).values({
        name,
        creditCode,
        legalPerson,
        phone,
        industry,
        type: type || 'tenant',
        status: status || 'active',
        registeredAddress,
        businessAddress,
        settledDate: settledDate ? new Date(settledDate) : null,
        remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建企业失败:', error);
      res.status(500).json({
        success: false,
        error: '创建企业失败',
      });
    }
  },

  /**
   * 获取单个企业
   */
  async getEnterprise(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select().from(enterprises).where(eq(enterprises.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '企业不存在',
        });
      }

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('获取企业详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取企业详情失败',
      });
    }
  },

  /**
   * 更新企业
   */
  async updateEnterprise(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, creditCode, legalPerson, phone, industry, type, status, registeredAddress, businessAddress, settledDate, remarks } = req.body;

      // 检查企业是否存在
      const existing = await db.select().from(enterprises).where(eq(enterprises.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '企业不存在',
        });
      }

      const result = await db.update(enterprises)
        .set({
          name,
          creditCode,
          legalPerson,
          phone,
          industry,
          type,
          status,
          registeredAddress,
          businessAddress,
          settledDate: settledDate ? new Date(settledDate) : null,
          remarks,
          updatedAt: new Date(),
        })
        .where(eq(enterprises.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新企业失败:', error);
      res.status(500).json({
        success: false,
        error: '更新企业失败',
      });
    }
  },

  /**
   * 删除企业
   */
  async deleteEnterprise(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查企业是否存在
      const existing = await db.select().from(enterprises).where(eq(enterprises.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '企业不存在',
        });
      }

      await db.delete(enterprises).where(eq(enterprises.id, id));

      res.json({
        success: true,
        message: '企业已删除',
      });
    } catch (error) {
      console.error('删除企业失败:', error);
      res.status(500).json({
        success: false,
        error: '删除企业失败',
      });
    }
  },
};
