import { Request, Response } from 'express';
import { db } from '../database/client';
import { registeredAddresses, enterprises } from '../database/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const addressController = {
  /**
   * 获取地址列表
   */
  async getAddresses(req: Request, res: Response) {
    try {
      const { status, building } = req.query;

      let query = db.select({
        id: registeredAddresses.id,
        code: registeredAddresses.code,
        fullAddress: registeredAddresses.fullAddress,
        building: registeredAddresses.building,
        floor: registeredAddresses.floor,
        room: registeredAddresses.room,
        area: registeredAddresses.area,
        status: registeredAddresses.status,
        enterpriseId: registeredAddresses.enterpriseId,
        enterpriseName: enterprises.name,
        assignedAt: registeredAddresses.assignedAt,
        remarks: registeredAddresses.remarks,
        createdAt: registeredAddresses.createdAt,
      }).from(registeredAddresses)
        .leftJoin(enterprises, eq(registeredAddresses.enterpriseId, enterprises.id))
        .orderBy(desc(registeredAddresses.createdAt));

      let results = await query;

      // 过滤
      if (status) {
        results = results.filter(a => a.status === status);
      }
      if (building) {
        results = results.filter(a => a.building === building);
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('获取地址列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取地址列表失败',
      });
    }
  },

  /**
   * 获取单个地址
   */
  async getAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select({
        id: registeredAddresses.id,
        code: registeredAddresses.code,
        fullAddress: registeredAddresses.fullAddress,
        building: registeredAddresses.building,
        floor: registeredAddresses.floor,
        room: registeredAddresses.room,
        area: registeredAddresses.area,
        status: registeredAddresses.status,
        enterpriseId: registeredAddresses.enterpriseId,
        enterpriseName: enterprises.name,
        assignedAt: registeredAddresses.assignedAt,
        remarks: registeredAddresses.remarks,
        createdAt: registeredAddresses.createdAt,
        updatedAt: registeredAddresses.updatedAt,
      }).from(registeredAddresses)
        .leftJoin(enterprises, eq(registeredAddresses.enterpriseId, enterprises.id))
        .where(eq(registeredAddresses.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('获取地址详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取地址详情失败',
      });
    }
  },

  /**
   * 创建地址
   */
  async createAddress(req: Request, res: Response) {
    try {
      const { code, fullAddress, building, floor, room, area, status, remarks } = req.body;

      if (!code || !fullAddress) {
        return res.status(400).json({
          success: false,
          error: '地址编码和完整地址不能为空',
        });
      }

      // 检查编码是否已存在
      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.code, code));
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '地址编码已存在',
        });
      }

      const result = await db.insert(registeredAddresses).values({
        code,
        fullAddress,
        building,
        floor,
        room,
        area,
        status: status || 'available',
        remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建地址失败:', error);
      res.status(500).json({
        success: false,
        error: '创建地址失败',
      });
    }
  },

  /**
   * 更新地址
   */
  async updateAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, fullAddress, building, floor, room, area, status, remarks } = req.body;

      // 检查地址是否存在
      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      // 如果修改了编码，检查新编码是否已存在
      if (code && code !== existing[0].code) {
        const duplicate = await db.select().from(registeredAddresses).where(eq(registeredAddresses.code, code));
        if (duplicate.length > 0) {
          return res.status(400).json({
            success: false,
            error: '地址编码已存在',
          });
        }
      }

      const result = await db.update(registeredAddresses)
        .set({
          code,
          fullAddress,
          building,
          floor,
          room,
          area,
          status,
          remarks,
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新地址失败:', error);
      res.status(500).json({
        success: false,
        error: '更新地址失败',
      });
    }
  },

  /**
   * 删除地址
   */
  async deleteAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查地址是否存在
      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      // 检查地址是否已分配
      if (existing[0].status === 'assigned') {
        return res.status(400).json({
          success: false,
          error: '地址已分配，无法删除',
        });
      }

      await db.delete(registeredAddresses).where(eq(registeredAddresses.id, id));

      res.json({
        success: true,
        message: '地址已删除',
      });
    } catch (error) {
      console.error('删除地址失败:', error);
      res.status(500).json({
        success: false,
        error: '删除地址失败',
      });
    }
  },

  /**
   * 分配地址
   */
  async assignAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { enterpriseId } = req.body;

      if (!enterpriseId) {
        return res.status(400).json({
          success: false,
          error: '企业ID不能为空',
        });
      }

      // 检查地址是否存在且可用
      const address = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (address.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      if (address[0].status === 'assigned') {
        return res.status(400).json({
          success: false,
          error: '地址已分配',
        });
      }

      // 检查企业是否存在
      const enterprise = await db.select().from(enterprises).where(eq(enterprises.id, enterpriseId));
      if (enterprise.length === 0) {
        return res.status(404).json({
          success: false,
          error: '企业不存在',
        });
      }

      // 分配地址
      const result = await db.update(registeredAddresses)
        .set({
          enterpriseId,
          status: 'assigned',
          assignedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('分配地址失败:', error);
      res.status(500).json({
        success: false,
        error: '分配地址失败',
      });
    }
  },

  /**
   * 释放地址
   */
  async releaseAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查地址是否存在
      const address = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (address.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      // 释放地址
      const result = await db.update(registeredAddresses)
        .set({
          enterpriseId: null,
          status: 'available',
          assignedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('释放地址失败:', error);
      res.status(500).json({
        success: false,
        error: '释放地址失败',
      });
    }
  },

  /**
   * 获取统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const total = await db.select({ count: sql<number>`count(*)::int` }).from(registeredAddresses);
      const available = await db.select({ count: sql<number>`count(*)::int` }).from(registeredAddresses).where(eq(registeredAddresses.status, 'available'));
      const reserved = await db.select({ count: sql<number>`count(*)::int` }).from(registeredAddresses).where(eq(registeredAddresses.status, 'reserved'));
      const assigned = await db.select({ count: sql<number>`count(*)::int` }).from(registeredAddresses).where(eq(registeredAddresses.status, 'assigned'));

      res.json({
        success: true,
        data: {
          total: total[0]?.count || 0,
          available: available[0]?.count || 0,
          reserved: reserved[0]?.count || 0,
          assigned: assigned[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: '获取统计信息失败',
      });
    }
  },
};
