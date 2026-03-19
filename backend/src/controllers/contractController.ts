import { Request, Response } from 'express';
import { db } from '../database/client';
import { contracts, settlementApplications, enterprises } from '../database/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const contractController = {
  /**
   * 获取合同列表
   */
  async getContracts(req: Request, res: Response) {
    try {
      const { status, contractType } = req.query;

      const results = await db.select({
        id: contracts.id,
        enterpriseId: contracts.enterpriseId,
        applicationId: contracts.applicationId,
        contractNo: contracts.contractNo,
        contractName: contracts.contractName,
        contractType: contracts.contractType,
        rentAmount: contracts.rentAmount,
        depositAmount: contracts.depositAmount,
        taxCommitment: contracts.taxCommitment,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        signedDate: contracts.signedDate,
        status: contracts.status,
        createdAt: contracts.createdAt,
        // 关联企业名称
        enterpriseName: settlementApplications.enterpriseName,
      }).from(contracts)
        .leftJoin(settlementApplications, eq(contracts.applicationId, settlementApplications.id))
        .orderBy(desc(contracts.createdAt));

      // 过滤
      let filtered = results;
      if (status) {
        filtered = filtered.filter(c => c.status === status);
      }
      if (contractType) {
        filtered = filtered.filter(c => c.contractType === contractType);
      }

      res.json({
        success: true,
        data: filtered,
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

      const result = await db.select().from(contracts).where(eq(contracts.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      const contract = result[0];

      // 获取关联的申请信息
      const application = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, contract.applicationId));

      res.json({
        success: true,
        data: {
          ...contract,
          application: application[0] || null,
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
      const data = req.body;

      if (!data.enterpriseId || !data.contractType) {
        return res.status(400).json({
          success: false,
          error: '企业ID和合同类型不能为空',
        });
      }

      // 生成合同编号
      const contractNo = data.contractNo || `CON-${Date.now()}`;

      const result = await db.insert(contracts).values({
        enterpriseId: data.enterpriseId,
        applicationId: data.applicationId,
        processId: data.processId,
        contractNo: contractNo,
        contractName: data.contractName,
        contractType: data.contractType,
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        taxCommitment: data.taxCommitment,
        startDate: data.startDate,
        endDate: data.endDate,
        signedDate: data.signedDate,
        status: data.status || 'draft',
        contractFileUrl: data.contractFileUrl,
        remarks: data.remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
        message: '合同创建成功',
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
      const data = req.body;

      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      const result = await db.update(contracts)
        .set({
          contractNo: data.contractNo,
          contractName: data.contractName,
          contractType: data.contractType,
          rentAmount: data.rentAmount,
          depositAmount: data.depositAmount,
          taxCommitment: data.taxCommitment,
          startDate: data.startDate,
          endDate: data.endDate,
          signedDate: data.signedDate,
          status: data.status,
          contractFileUrl: data.contractFileUrl,
          remarks: data.remarks,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '合同更新成功',
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
   * 删除合同
   */
  async deleteContract(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
   * 签署合同
   */
  async signContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { signedDate } = req.body;

      const existing = await db.select().from(contracts).where(eq(contracts.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '合同不存在',
        });
      }

      if (existing[0].status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能签署待签状态的合同',
        });
      }

      const result = await db.update(contracts)
        .set({
          status: 'signed',
          signedDate: signedDate || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '合同已签署',
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
   * 获取统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await db.select({
        status: contracts.status,
        contractType: contracts.contractType,
        count: sql<number>`count(*)::int`,
      }).from(contracts)
        .groupBy(contracts.status, contracts.contractType);

      const result = {
        total: 0,
        draft: 0,
        pending: 0,
        signed: 0,
        active: 0,
        expired: 0,
        terminated: 0,
        free: 0,
        paid: 0,
        taxCommitment: 0,
      };

      stats.forEach(s => {
        result.total += s.count;
        if (s.status === 'draft') result.draft += s.count;
        if (s.status === 'pending') result.pending += s.count;
        if (s.status === 'signed') result.signed += s.count;
        if (s.status === 'active') result.active += s.count;
        if (s.status === 'expired') result.expired += s.count;
        if (s.status === 'terminated') result.terminated += s.count;
        if (s.contractType === 'free') result.free += s.count;
        if (s.contractType === 'paid') result.paid += s.count;
        if (s.contractType === 'tax_commitment') result.taxCommitment += s.count;
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
