import { Request, Response } from 'express';
import { db } from '../database/client';
import { settlementProcesses, settlementApplications, enterprises, contracts } from '../database/schema';
import { eq, desc } from 'drizzle-orm';

// 流程阶段定义
const STAGE_CONFIG: Record<string, { name: string; description: string }> = {
  approved: { name: '审批通过', description: '政府审批已通过' },
  address_assigned: { name: '地址已分配', description: '已分配注册地址' },
  pre_approval: { name: '预核准办理中', description: '正在办理预核准' },
  pre_approval_done: { name: '前置审批中', description: '正在办理前置审批' },
  registering: { name: '企业注册中', description: '正在办理企业注册' },
  seal_applying: { name: '公章办理中', description: '正在办理公章' },
  pending_contract: { name: '待签合同', description: '等待签订合同' },
  completed: { name: '入驻完成', description: '入驻流程已完成' },
};

export const processController = {
  /**
   * 获取流程列表
   */
  async getProcesses(req: Request, res: Response) {
    try {
      const { processType, currentStage } = req.query;

      let results = await db.select({
        id: settlementProcesses.id,
        applicationId: settlementProcesses.applicationId,
        enterpriseId: settlementProcesses.enterpriseId,
        enterpriseName: settlementApplications.enterpriseName,
        processType: settlementProcesses.processType,
        currentStage: settlementProcesses.currentStage,
        stageProgress: settlementProcesses.stageProgress,
        startedAt: settlementProcesses.startedAt,
        completedAt: settlementProcesses.completedAt,
        applicationType: settlementApplications.applicationType,
        settlementType: settlementApplications.settlementType,
        contactPerson: settlementApplications.contactPerson,
        contactPhone: settlementApplications.contactPhone,
      }).from(settlementProcesses)
        .leftJoin(settlementApplications, eq(settlementProcesses.applicationId, settlementApplications.id))
        .orderBy(desc(settlementProcesses.createdAt));

      // 过滤
      if (processType) {
        results = results.filter(p => p.processType === processType);
      }
      if (currentStage) {
        results = results.filter(p => p.currentStage === currentStage);
      }

      // 添加阶段名称
      const processedResults = results.map(r => ({
        ...r,
        currentStageName: r.currentStage ? STAGE_CONFIG[r.currentStage]?.name : null,
      }));

      res.json({
        success: true,
        data: processedResults,
      });
    } catch (error) {
      console.error('获取流程列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取流程列表失败',
      });
    }
  },

  /**
   * 获取单个流程
   */
  async getProcess(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select({
        id: settlementProcesses.id,
        applicationId: settlementProcesses.applicationId,
        enterpriseId: settlementProcesses.enterpriseId,
        processType: settlementProcesses.processType,
        currentStage: settlementProcesses.currentStage,
        stageProgress: settlementProcesses.stageProgress,
        startedAt: settlementProcesses.startedAt,
        completedAt: settlementProcesses.completedAt,
        remarks: settlementProcesses.remarks,
        createdAt: settlementProcesses.createdAt,
        updatedAt: settlementProcesses.updatedAt,
        // 申请信息
        enterpriseName: settlementApplications.enterpriseName,
        contactPerson: settlementApplications.contactPerson,
        contactPhone: settlementApplications.contactPhone,
        applicationType: settlementApplications.applicationType,
        settlementType: settlementApplications.settlementType,
      }).from(settlementProcesses)
        .leftJoin(settlementApplications, eq(settlementProcesses.applicationId, settlementApplications.id))
        .where(eq(settlementProcesses.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
        });
      }

      // 获取关联的企业信息
      let enterprise = null;
      if (result[0].enterpriseId) {
        const enterpriseResult = await db.select().from(enterprises).where(eq(enterprises.id, result[0].enterpriseId));
        enterprise = enterpriseResult[0] || null;
      }

      // 获取关联的合同信息
      let contract = null;
      if (result[0].enterpriseId) {
        const contractResult = await db.select().from(contracts).where(eq(contracts.enterpriseId, result[0].enterpriseId));
        contract = contractResult[0] || null;
      }

      res.json({
        success: true,
        data: {
          ...result[0],
          currentStageName: result[0].currentStage ? STAGE_CONFIG[result[0].currentStage]?.name : null,
          enterprise,
          contract,
          stageConfig: STAGE_CONFIG,
        },
      });
    } catch (error) {
      console.error('获取流程详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取流程详情失败',
      });
    }
  },

  /**
   * 更新流程阶段
   */
  async updateStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stage, status, attachments, remarks } = req.body;

      // 检查流程是否存在
      const existing = await db.select().from(settlementProcesses).where(eq(settlementProcesses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
        });
      }

      const process = existing[0];
      const stageProgress = process.stageProgress as any[] || [];

      // 更新阶段进度
      const stageIndex = stageProgress.findIndex(s => s.stage === stage);
      if (stageIndex === -1) {
        return res.status(400).json({
          success: false,
          error: '无效的阶段',
        });
      }

      // 更新阶段状态
      stageProgress[stageIndex] = {
        ...stageProgress[stageIndex],
        status,
        startedAt: status === 'in_progress' ? new Date().toISOString() : stageProgress[stageIndex].startedAt,
        completedAt: status === 'completed' ? new Date().toISOString() : stageProgress[stageIndex].completedAt,
        attachments: attachments || stageProgress[stageIndex].attachments,
        remarks: remarks || stageProgress[stageIndex].remarks,
      };

      // 如果阶段完成，更新当前阶段为下一个
      let currentStage = process.currentStage;
      if (status === 'completed') {
        const nextStageIndex = stageIndex + 1;
        if (nextStageIndex < stageProgress.length) {
          currentStage = stageProgress[nextStageIndex].stage;
          stageProgress[nextStageIndex].status = 'in_progress';
          stageProgress[nextStageIndex].startedAt = new Date().toISOString();
        }
      }

      // 检查是否全部完成
      let completedAt = process.completedAt;
      const allCompleted = stageProgress.every(s => s.status === 'completed' || s.status === 'skipped');
      if (allCompleted) {
        completedAt = new Date();
        currentStage = 'completed';
      }

      const result = await db.update(settlementProcesses)
        .set({
          currentStage,
          stageProgress,
          completedAt,
          updatedAt: new Date(),
        })
        .where(eq(settlementProcesses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新流程阶段失败:', error);
      res.status(500).json({
        success: false,
        error: '更新流程阶段失败',
      });
    }
  },

  /**
   * 跳过阶段
   */
  async skipStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stage, remarks } = req.body;

      // 检查流程是否存在
      const existing = await db.select().from(settlementProcesses).where(eq(settlementProcesses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
        });
      }

      const process = existing[0];
      const stageProgress = process.stageProgress as any[] || [];

      // 更新阶段进度
      const stageIndex = stageProgress.findIndex(s => s.stage === stage);
      if (stageIndex === -1) {
        return res.status(400).json({
          success: false,
          error: '无效的阶段',
        });
      }

      // 标记为跳过
      stageProgress[stageIndex] = {
        ...stageProgress[stageIndex],
        status: 'skipped',
        remarks: remarks || '已跳过',
      };

      // 更新当前阶段为下一个
      let currentStage = process.currentStage;
      const nextStageIndex = stageIndex + 1;
      if (nextStageIndex < stageProgress.length) {
        currentStage = stageProgress[nextStageIndex].stage;
        stageProgress[nextStageIndex].status = 'in_progress';
        stageProgress[nextStageIndex].startedAt = new Date().toISOString();
      }

      const result = await db.update(settlementProcesses)
        .set({
          currentStage,
          stageProgress,
          updatedAt: new Date(),
        })
        .where(eq(settlementProcesses.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('跳过阶段失败:', error);
      res.status(500).json({
        success: false,
        error: '跳过阶段失败',
      });
    }
  },

  /**
   * 关联企业
   */
  async linkEnterprise(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { enterpriseId } = req.body;

      if (!enterpriseId) {
        return res.status(400).json({
          success: false,
          error: '企业ID不能为空',
        });
      }

      // 检查流程是否存在
      const existing = await db.select().from(settlementProcesses).where(eq(settlementProcesses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
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

      // 更新流程
      const result = await db.update(settlementProcesses)
        .set({
          enterpriseId,
          updatedAt: new Date(),
        })
        .where(eq(settlementProcesses.id, id))
        .returning();

      // 同时更新申请表
      await db.update(settlementApplications)
        .set({
          enterpriseId,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, existing[0].applicationId));

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('关联企业失败:', error);
      res.status(500).json({
        success: false,
        error: '关联企业失败',
      });
    }
  },

  /**
   * 获取统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const total = await db.select({ count: 'count' }).from(settlementProcesses);
      const inProgress = await db.select().from(settlementProcesses);
      
      // 统计各阶段数量
      const stageStats: Record<string, number> = {};
      for (const stage of Object.keys(STAGE_CONFIG)) {
        stageStats[stage] = inProgress.filter(p => p.currentStage === stage).length;
      }

      const completed = inProgress.filter(p => p.currentStage === 'completed').length;

      res.json({
        success: true,
        data: {
          total: inProgress.length,
          inProgress: inProgress.length - completed,
          completed,
          stageStats,
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
