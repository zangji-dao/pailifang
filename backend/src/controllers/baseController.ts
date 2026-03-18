/**
 * 基地控制器 - 使用 Drizzle ORM
 */

import { Request, Response } from 'express';
import { db, bases, meters, spaces, regNumbers, enterprises, eq, desc, sql } from '../database/client';

// Π立方基地物业数据
const METER_DATA = [
  { code: '1-102', name: '1号楼102室', water: '897357', electricity: '2200922309755', heating: '270602', area: '276.44' },
  { code: '1-103', name: '1号楼103室', water: '897358', electricity: '2200922309742', heating: '270603', area: '282.95' },
  { code: '1-104', name: '1号楼104室', water: '897359', electricity: '2200922309713', heating: '270604', area: '274.79' },
  { code: '1-105', name: '1号楼105室', water: '897360', electricity: '2200922309726', heating: '270605', area: '280.12' },
  { code: '1-106', name: '1号楼106室', water: '897361', electricity: '2200922309713', heating: '270606', area: '275.64' },
  { code: '1-107', name: '1号楼107室', water: '897362', electricity: '2200922309700', heating: '270607', area: '274.79' },
  { code: '1-108', name: '1号楼108室', water: '897393', electricity: '2200922309696', heating: '270608', area: '276.44' },
  { code: '2-104', name: '2号楼104室', water: '897367', electricity: '2200922309814', heating: '270784', area: '255.79' },
];

export const baseController = {
  /**
   * 获取基地列表
   */
  async getBases(req: Request, res: Response) {
    try {
      // 获取基地列表
      const basesList = await db
        .select()
        .from(bases)
        .orderBy(desc(bases.createdAt));

      // 获取每个基地的物业数量
      const basesWithStats = await Promise.all(
        basesList.map(async (base) => {
          const meterResult = await db
            .select({ count: sql`count(*)` })
            .from(meters)
            .where(eq(meters.baseId, base.id));

          return {
            ...base,
            meterCount: Number(meterResult[0]?.count) || 0,
          };
        })
      );

      return res.json({
        success: true,
        data: basesWithStats,
      });
    } catch (error) {
      console.error('获取基地列表失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取基地列表失败',
      });
    }
  },

  /**
   * 初始化基地数据
   */
  async initBaseData(req: Request, res: Response) {
    try {
      const results: any = {};

      // 1. 创建基地
      const existingBase = await db
        .select()
        .from(bases)
        .where(eq(bases.name, 'Π立方企服中心'))
        .limit(1);

      let baseId: string;
      if (existingBase.length === 0) {
        await db.insert(bases).values({
          name: 'Π立方企服中心',
          address: '吉林省松原市宁江区义乌城',
          status: 'active',
        });

        // 获取刚创建的基地
        const created = await db
          .select()
          .from(bases)
          .where(eq(bases.name, 'Π立方企服中心'))
          .limit(1);
        baseId = created[0].id;
        results.base = created[0];
      } else {
        baseId = existingBase[0].id;
        results.base = existingBase[0];
      }

      // 2. 创建物业
      const existingMeters = await db
        .select()
        .from(meters)
        .where(eq(meters.baseId, baseId));

      if (existingMeters.length === 0) {
        const metersToInsert = METER_DATA.map((meter) => ({
          baseId: baseId,
          code: meter.code,
          name: meter.name,
          waterNumber: meter.water,
          electricityNumber: meter.electricity,
          heatingNumber: meter.heating,
          waterType: 'base',
          electricityType: 'base',
          heatingType: 'base',
          area: meter.area,
          status: 'active',
        }));

        await db.insert(meters).values(metersToInsert);
        results.meters = metersToInsert;

        // 3. 为每个物业创建默认物理空间
        const createdMeters = await db
          .select()
          .from(meters)
          .where(eq(meters.baseId, baseId));

        if (createdMeters.length > 0) {
          const spacesToInsert = createdMeters.map((meter: any) => ({
            meterId: meter.id,
            code: '主空间',
            name: '主办公区',
            area: meter.area,
            status: 'active',
          }));

          await db.insert(spaces).values(spacesToInsert);
          results.spaces = spacesToInsert;
        }
      } else {
        results.meters = existingMeters;
        results.message = '物业数据已存在，跳过创建';
      }

      return res.json({
        success: true,
        message: '基地数据初始化成功',
        data: results,
      });
    } catch (error: any) {
      console.error('初始化基地数据失败:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '初始化失败',
      });
    }
  },

  /**
   * 获取基地详情
   */
  async getBaseById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .select()
        .from(bases)
        .where(eq(bases.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '基地不存在',
        });
      }

      // 获取物业列表
      const meterList = await db
        .select()
        .from(meters)
        .where(eq(meters.baseId, id));

      return res.json({
        success: true,
        data: {
          ...result[0],
          meters: meterList,
        },
      });
    } catch (error) {
      console.error('获取基地详情失败:', error);
      return res.status(500).json({
        success: false,
        error: '获取基地详情失败',
      });
    }
  },

  /**
   * 创建基地
   */
  async createBase(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await db
        .insert(bases)
        .values({
          name: body.name,
          address: body.address,
          status: body.status || 'active',
        })
        .returning();

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建基地失败:', error);
      return res.status(500).json({
        success: false,
        error: '创建基地失败',
      });
    }
  },

  /**
   * 更新基地
   */
  async updateBase(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const result = await db
        .update(bases)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(bases.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '基地不存在',
        });
      }

      return res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新基地失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新基地失败',
      });
    }
  },

  /**
   * 删除基地
   */
  async deleteBase(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .delete(bases)
        .where(eq(bases.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '基地不存在',
        });
      }

      return res.json({
        success: true,
        message: '基地已删除',
      });
    } catch (error) {
      console.error('删除基地失败:', error);
      return res.status(500).json({
        success: false,
        error: '删除基地失败',
      });
    }
  },
};
