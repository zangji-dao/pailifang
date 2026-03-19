import { Request, Response } from 'express';
import { db } from '../database/client';
import { contracts, enterprises, settlementApplications, settlementPayments } from '../database/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const contractController = {
  /**
   * 获取合同列表
   */
  async getContracts(req: Request, res: Response) {
    try {
      const { status, contractType } = req.query;

      let results = await db.select({
        id: contracts.id,
        enterpriseId: contracts.enterpriseId,
        enterpriseName: enterprises.name,
        applicationId: contracts.applicationId,
        contractNo: contracts.contractNo,
        contractType: contracts.contractType,
        rentAmount: contracts.rentAmount,
        depositAmount: contracts.depositAmount,
        taxCommitment: contracts.taxCommitment,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        signedDate: contracts.signedDate,
        status: contracts.status,
        remarks: contracts.remarks,
        createdAt: contracts.createdAt,
      }).from(contracts)
        .leftJoin(enterprises, eq(contracts.enterpriseId, enterprises.id))
        .orderBy(desc(contracts.createdAt));

      // 过滤
      if (status) {
        results = results.filter(c => c.status === status);
      }
      if (contractType) {
        results = results.filter(c => c.contractType === contractType);
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('获取合同列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取合同列表失败',
      });
    }
  },

  /**
   * 获取单个合同
   */
  async getContract(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select({
        id: contracts.id,
        enterpriseId: contracts.enterpriseId,
        enterpriseName: enterprises.name,
        applicationId: contracts.applicationId,
        contractNo: contracts.contractNo,
        contractType: contracts.contractType,
        rentAmount: contracts.rentAmount,
        depositAmount: contracts.depositAmount,
        taxCommitment: contracts.taxCommitment,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        signedDate: contracts.signedDate,
        status: contracts.status,
        contractFileUrl: contracts.contractFileUrl,
        remarks: contracts.remarks,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
      }).from(contracts)
        .leftJoin(enterprises, eq(contracts.enterpriseId, enterprises.id))
        .where(eq(contracts.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      // 获取关联的费用记录
      const payments = await db.select().from(settlementPayments).where(eq(settlementPayments.contractId, id));

      res.json({
        success: true,
        data: {
          ...result[0],
          payments,
        },
      });
    } catch (error) {
      console.error('获取合同详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取合同详情失败',
      });
    }
  },

  /**
   * 创建合同
   */
  async createContract(req: Request, res: Response) {
    try {
      const { 
        enterpriseId, 
        applicationId,
        contractNo, 
        contractType, 
        rentAmount, 
        depositAmount, 
        taxCommitment,
        startDate, 
        endDate, 
        remarks 
      } = req.body;

      if (!enterpriseId || !contractType) {
        return res.status(400).json({
          success: false,
          error: '企业ID和合同类型不能为空',
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

      const result = await db.insert(contracts).values({
        enterpriseId,
        applicationId,
        contractNo,
        contractType,
        rentAmount,
        depositAmount,
        taxCommitment,
        startDate,
        endDate,
        status: 'draft',
        remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建合同失败:', error);
      res.status(500).json({
        success: false,
        error: '创建合同失败',
      });
    }
  },

  /**
   * 更新合同
   */
  async updateContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        contractNo, 
        contractType, 
        rentAmount, 
        depositAmount, 
        taxCommitment,
        startDate, 
        endDate, 
        remarks 
      } = req.body;

      // 检查合同是否存在
      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      const result = await db.update(contracts)
        .set({
          contractNo,
          contractType,
          rentAmount,
          depositAmount,
          taxCommitment,
          startDate,
          endDate,
          remarks,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新合同失败:', error);
      res.status(500).json({
        success: false,
        error: '更新合同失败',
      });
    }
  },

  /**
   * 签署合同
   */
  async signContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { signedDate, contractFileUrl } = req.body;

      // 检查合同是否存在
      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      if (existing[0].status !== 'draft' && existing[0].status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能签署草稿或待签状态的合同',
        });
      }

      const result = await db.update(contracts)
        .set({
          status: 'signed',
          signedDate: signedDate || new Date(),
          contractFileUrl,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('签署合同失败:', error);
      res.status(500).json({
        success: false,
        error: '签署合同失败',
      });
    }
  },

  /**
   * 终止合同
   */
  async terminateContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      // 检查合同是否存在
      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      const result = await db.update(contracts)
        .set({
          status: 'terminated',
          remarks: remarks || existing[0].remarks,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('终止合同失败:', error);
      res.status(500).json({
        success: false,
        error: '终止合同失败',
      });
    }
  },

  /**
   * 删除合同
   */
  async deleteContract(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查合同是否存在
      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      // 只有草稿状态才能删除
      if (existing[0].status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: '只能删除草稿状态的合同',
        });
      }

      await db.delete(contracts).where(eq(contracts.id, id));

      res.json({
        success: true,
        message: '合同已删除',
      });
    } catch (error) {
      console.error('删除合同失败:', error);
      res.status(500).json({
        success: false,
        error: '删除合同失败',
      });
    }
  },

  /**
   * 获取统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const total = await db.select({ count: sql<number>`count(*)::int` }).from(contracts);
      const draft = await db.select({ count: sql<number>`count(*)::int` }).from(contracts).where(eq(contracts.status, 'draft'));
      const pending = await db.select({ count: sql<number>`count(*)::int` }).from(contracts).where(eq(contracts.status, 'pending'));
      const signed = await db.select({ count: sql<number>`count(*)::int` }).from(contracts).where(eq(contracts.status, 'signed'));
      const expired = await db.select({ count: sql<number>`count(*)::int` }).from(contracts).where(eq(contracts.status, 'expired'));

      res.json({
        success: true,
        data: {
          total: total[0]?.count || 0,
          draft: draft[0]?.count || 0,
          pending: pending[0]?.count || 0,
          signed: signed[0]?.count || 0,
          expired: expired[0]?.count || 0,
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
