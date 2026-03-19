import { Request, Response } from 'express';
import { db } from '../database/client';
import { registeredAddresses } from '../database/schema';
import { eq, sql, desc, isNull } from 'drizzle-orm';

export const addressController = {
  /**
   * 获取地址列表
   */
  async getAddresses(req: Request, res: Response) {
    try {
      const { status, addressType } = req.query;

      let results = await db.select().from(registeredAddresses).orderBy(desc(registeredAddresses.createdAt));

      // 过滤
      if (status) {
        results = results.filter(a => a.status === status);
      }
      if (addressType) {
        results = results.filter(a => a.addressType === addressType);
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
   * 获取可用地址列表（用于下拉选择）
   */
  async getAvailableAddresses(req: Request, res: Response) {
    try {
      const results = await db.select({
        id: registeredAddresses.id,
        addressCode: registeredAddresses.addressCode,
        fullAddress: registeredAddresses.fullAddress,
        building: registeredAddresses.building,
        floor: registeredAddresses.floor,
        room: registeredAddresses.room,
        area: registeredAddresses.area,
      }).from(registeredAddresses)
        .where(eq(registeredAddresses.status, 'available'))
        .orderBy(registeredAddresses.addressCode);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('获取可用地址列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取可用地址列表失败',
      });
    }
  },

  /**
   * 获取单个地址
   */
  async getAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));

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
      const data = req.body;

      if (!data.addressCode || !data.fullAddress) {
        return res.status(400).json({
          success: false,
          error: '地址编码和完整地址不能为空',
        });
      }

      // 检查地址编码是否重复
      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.addressCode, data.addressCode));
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '地址编码已存在',
        });
      }

      const result = await db.insert(registeredAddresses).values({
        addressCode: data.addressCode,
        province: data.province,
        city: data.city,
        district: data.district,
        street: data.street,
        building: data.building,
        floor: data.floor,
        room: data.room,
        fullAddress: data.fullAddress,
        addressType: data.addressType || 'registered',
        area: data.area,
        status: data.status || 'available',
        remarks: data.remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
        message: '地址创建成功',
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
      const data = req.body;

      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      // 如果修改了地址编码，检查是否重复
      if (data.addressCode && data.addressCode !== existing[0].addressCode) {
        const duplicate = await db.select().from(registeredAddresses).where(eq(registeredAddresses.addressCode, data.addressCode));
        if (duplicate.length > 0) {
          return res.status(400).json({
            success: false,
            error: '地址编码已存在',
          });
        }
      }

      const result = await db.update(registeredAddresses)
        .set({
          addressCode: data.addressCode,
          province: data.province,
          city: data.city,
          district: data.district,
          street: data.street,
          building: data.building,
          floor: data.floor,
          room: data.room,
          fullAddress: data.fullAddress,
          addressType: data.addressType,
          area: data.area,
          status: data.status,
          remarks: data.remarks,
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '地址更新成功',
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

      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      // 已分配的地址不能删除
      if (existing[0].status === 'assigned') {
        return res.status(400).json({
          success: false,
          error: '已分配的地址不能删除',
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
   * 批量创建地址
   */
  async batchCreateAddresses(req: Request, res: Response) {
    try {
      const { addresses } = req.body;

      if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请提供地址列表',
        });
      }

      const results = [];
      const errors = [];

      for (const addr of addresses) {
        try {
          if (!addr.addressCode || !addr.fullAddress) {
            errors.push({ addressCode: addr.addressCode, error: '地址编码和完整地址不能为空' });
            continue;
          }

          // 检查重复
          const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.addressCode, addr.addressCode));
          if (existing.length > 0) {
            errors.push({ addressCode: addr.addressCode, error: '地址编码已存在' });
            continue;
          }

          const result = await db.insert(registeredAddresses).values({
            addressCode: addr.addressCode,
            fullAddress: addr.fullAddress,
            province: addr.province,
            city: addr.city,
            district: addr.district,
            street: addr.street,
            building: addr.building,
            floor: addr.floor,
            room: addr.room,
            addressType: addr.addressType || 'registered',
            area: addr.area,
            status: addr.status || 'available',
            remarks: addr.remarks,
          }).returning();

          results.push(result[0]);
        } catch (err) {
          errors.push({ addressCode: addr.addressCode, error: String(err) });
        }
      }

      res.json({
        success: true,
        data: {
          created: results,
          errors: errors,
          total: addresses.length,
          successCount: results.length,
          errorCount: errors.length,
        },
      });
    } catch (error) {
      console.error('批量创建地址失败:', error);
      res.status(500).json({
        success: false,
        error: '批量创建地址失败',
      });
    }
  },

  /**
   * 分配地址
   */
  async assignAddress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { applicationId, enterpriseId } = req.body;

      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      if (existing[0].status !== 'available') {
        return res.status(400).json({
          success: false,
          error: '地址不可用',
        });
      }

      const result = await db.update(registeredAddresses)
        .set({
          status: 'assigned',
          applicationId: applicationId || null,
          enterpriseId: enterpriseId || null,
          assignedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '地址已分配',
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

      const existing = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '地址不存在',
        });
      }

      const result = await db.update(registeredAddresses)
        .set({
          status: 'available',
          applicationId: null,
          enterpriseId: null,
          assignedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(registeredAddresses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '地址已释放',
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
      const stats = await db.select({
        status: registeredAddresses.status,
        count: sql<number>`count(*)::int`,
      }).from(registeredAddresses)
        .groupBy(registeredAddresses.status);

      const result = {
        total: 0,
        available: 0,
        reserved: 0,
        assigned: 0,
      };

      stats.forEach(s => {
        result.total += s.count;
        if (s.status === 'available') result.available = s.count;
        if (s.status === 'reserved') result.reserved = s.count;
        if (s.status === 'assigned') result.assigned = s.count;
      });

      res.json({
        success: true,
        data: result,
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
