import { Request, Response } from 'express';
import { db } from '../database/client';
import { settlementProcesses, settlementApplications, enterprises, contracts } from '../database/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import type { StageProgress } from '../database/schema';

export const processController = {
  /**
   * 获取流程列表
   */
  async getProcesses(req: Request, res: Response) {
    try {
      const { overallStatus, processType } = req.query;

      const results = await db.select({
        id: settlementProcesses.id,
        applicationId: settlementProcesses.applicationId,
        enterpriseName: settlementProcesses.enterpriseName,
        processType: settlementProcesses.processType,
        currentStage: settlementProcesses.currentStage,
        currentStageIndex: settlementProcesses.currentStageIndex,
        overallStatus: settlementProcesses.overallStatus,
        startedAt: settlementProcesses.startedAt,
        completedAt: settlementProcesses.completedAt,
        createdAt: settlementProcesses.createdAt,
        // 关联申请信息
        legalPersonName: settlementApplications.legalPersonName,
        legalPersonPhone: settlementApplications.legalPersonPhone,
        contactPersonName: settlementApplications.contactPersonName,
        contactPersonPhone: settlementApplications.contactPersonPhone,
        assignedAddress: settlementApplications.assignedAddress,
      }).from(settlementProcesses)
        .leftJoin(settlementApplications, eq(settlementProcesses.applicationId, settlementApplications.id))
        .orderBy(desc(settlementProcesses.createdAt));

      // 过滤
      let filtered = results;
      if (overallStatus) {
        filtered = filtered.filter(p => p.overallStatus === overallStatus);
      }
      if (processType) {
        filtered = filtered.filter(p => p.processType === processType);
      }

      res.json({
        success: true,
        data: filtered,
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
   * 获取单个流程详情
   */
  async getProcess(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select().from(settlementProcesses).where(eq(settlementProcesses.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
        });
      }

      const process = result[0];

      // 获取关联的申请信息
      const application = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, process.applicationId));

      // 获取关联的合同信息
      const contract = await db.select()
        .from(contracts)
        .where(eq(contracts.applicationId, process.applicationId));

      res.json({
        success: true,
        data: {
          ...process,
          application: application[0] || null,
          contract: contract[0] || null,
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
      const { stage, action, remarks, attachments } = req.body;

      const existing = await db.select().from(settlementProcesses).where(eq(settlementProcesses.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '流程不存在',
        });
      }

      const process = existing[0];
      const stages: StageProgress[] = process.stages as StageProgress[] || [];

      // 找到对应阶段
      const stageIndex = stages.findIndex(s => s.stage === stage);
      if (stageIndex === -1) {
        return res.status(400).json({
          success: false,
          error: '无效的阶段',
        });
      }

      const now = new Date().toISOString();

      // 根据动作更新阶段状态
      switch (action) {
        case 'start':
          stages[stageIndex].status = 'in_progress';
          stages[stageIndex].startedAt = now;
          break;
        case 'complete':
          stages[stageIndex].status = 'completed';
          stages[stageIndex].completedAt = now;
          break;
        case 'skip':
          stages[stageIndex].status = 'skipped';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: '无效的操作',
          });
      }

      if (remarks) {
        stages[stageIndex].remarks = remarks;
      }
      if (attachments) {
        stages[stageIndex].attachments = attachments;
      }

      // 计算当前阶段
      let currentStageIndex = stageIndex;
      if (action === 'complete' || action === 'skip') {
        // 找到下一个未完成的阶段
        for (let i = stageIndex + 1; i < stages.length; i++) {
          if (stages[i].status === 'pending') {
            currentStageIndex = i;
            break;
          }
        }
      }

      // 检查是否所有阶段都已完成
      const allCompleted = stages.every(s => s.status === 'completed' || s.status === 'skipped');
      const overallStatus = allCompleted ? 'completed' : 'in_progress';

      // 更新流程
      const result = await db.update(settlementProcesses)
        .set({
          stages: stages,
          currentStage: stages[currentStageIndex].stage,
          currentStageIndex: currentStageIndex,
          overallStatus: overallStatus,
          completedAt: allCompleted ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(settlementProcesses.id, id))
        .returning();

      // 如果流程完成，更新申请状态
      if (allCompleted) {
        await db.update(settlementApplications)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(settlementApplications.id, process.applicationId));
      }

      res.json({
        success: true,
        data: result[0],
        message: action === 'complete' ? '阶段已完成' : action === 'skip' ? '阶段已跳过' : '阶段已开始',
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
   * 获取流程统计
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await db.select({
        overallStatus: settlementProcesses.overallStatus,
        processType: settlementProcesses.processType,
        count: sql<number>`count(*)::int`,
      }).from(settlementProcesses)
        .groupBy(settlementProcesses.overallStatus, settlementProcesses.processType);

      const result = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        newEnterprise: 0,
        migration: 0,
      };

      stats.forEach(s => {
        result.total += s.count;
        if (s.overallStatus === 'pending') result.pending += s.count;
        if (s.overallStatus === 'in_progress') result.inProgress += s.count;
        if (s.overallStatus === 'completed') result.completed += s.count;
        if (s.overallStatus === 'cancelled') result.cancelled += s.count;
        if (s.processType === 'new') result.newEnterprise += s.count;
        if (s.processType === 'migration') result.migration += s.count;
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('获取流程统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取流程统计失败',
      });
    }
  },
};
