import { Request, Response } from 'express';
import { db } from '../database/client';
import { settlementApplications, settlementProcesses, registeredAddresses, enterprises } from '../database/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

// 流程阶段定义
const NEW_ENTERPRISE_STAGES = [
  { stage: 'approved', name: '审批通过', order: 1 },
  { stage: 'address_assigned', name: '地址已分配', order: 2 },
  { stage: 'pre_approval', name: '预核准办理中', order: 3 },
  { stage: 'pre_approval_done', name: '前置审批中', order: 4 },
  { stage: 'registering', name: '企业注册中', order: 5 },
  { stage: 'seal_applying', name: '公章办理中', order: 6 },
  { stage: 'pending_contract', name: '待签合同', order: 7 },
  { stage: 'completed', name: '入驻完成', order: 8 },
];

const MIGRATION_STAGES = [
  { stage: 'approved', name: '审批通过', order: 1 },
  { stage: 'address_assigned', name: '地址已分配', order: 2 },
  { stage: 'pending_contract', name: '待签合同', order: 3 },
  { stage: 'completed', name: '入驻完成', order: 4 },
];

export const applicationController = {
  /**
   * 获取申请列表
   */
  async getApplications(req: Request, res: Response) {
    try {
      const { approvalStatus, applicationType, settlementType } = req.query;

      let results = await db.select({
        id: settlementApplications.id,
        enterpriseName: settlementApplications.enterpriseName,
        contactPerson: settlementApplications.contactPerson,
        contactPhone: settlementApplications.contactPhone,
        applicationType: settlementApplications.applicationType,
        settlementType: settlementApplications.settlementType,
        approvalStatus: settlementApplications.approvalStatus,
        approvalDate: settlementApplications.approvalDate,
        addressId: settlementApplications.addressId,
        addressCode: registeredAddresses.code,
        enterpriseId: settlementApplications.enterpriseId,
        remarks: settlementApplications.remarks,
        createdAt: settlementApplications.createdAt,
      }).from(settlementApplications)
        .leftJoin(registeredAddresses, eq(settlementApplications.addressId, registeredAddresses.id))
        .orderBy(desc(settlementApplications.createdAt));

      // 过滤
      if (approvalStatus) {
        results = results.filter(a => a.approvalStatus === approvalStatus);
      }
      if (applicationType) {
        results = results.filter(a => a.applicationType === applicationType);
      }
      if (settlementType) {
        results = results.filter(a => a.settlementType === settlementType);
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('获取申请列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取申请列表失败',
      });
    }
  },

  /**
   * 获取单个申请
   */
  async getApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.select({
        id: settlementApplications.id,
        enterpriseName: settlementApplications.enterpriseName,
        contactPerson: settlementApplications.contactPerson,
        contactPhone: settlementApplications.contactPhone,
        applicationType: settlementApplications.applicationType,
        settlementType: settlementApplications.settlementType,
        approvalFormUrl: settlementApplications.approvalFormUrl,
        approvalStatus: settlementApplications.approvalStatus,
        approvalDate: settlementApplications.approvalDate,
        rejectionReason: settlementApplications.rejectionReason,
        addressId: settlementApplications.addressId,
        addressCode: registeredAddresses.code,
        addressFull: registeredAddresses.fullAddress,
        addressAssignedAt: settlementApplications.addressAssignedAt,
        enterpriseId: settlementApplications.enterpriseId,
        remarks: settlementApplications.remarks,
        createdAt: settlementApplications.createdAt,
        updatedAt: settlementApplications.updatedAt,
      }).from(settlementApplications)
        .leftJoin(registeredAddresses, eq(settlementApplications.addressId, registeredAddresses.id))
        .where(eq(settlementApplications.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 获取流程信息
      const process = await db.select().from(settlementProcesses).where(eq(settlementProcesses.applicationId, id));

      res.json({
        success: true,
        data: {
          ...result[0],
          process: process[0] || null,
        },
      });
    } catch (error) {
      console.error('获取申请详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取申请详情失败',
      });
    }
  },

  /**
   * 创建申请
   */
  async createApplication(req: Request, res: Response) {
    try {
      const { 
        enterpriseName, 
        contactPerson, 
        contactPhone, 
        applicationType, 
        settlementType, 
        approvalFormUrl,
        remarks 
      } = req.body;

      if (!enterpriseName || !applicationType || !settlementType) {
        return res.status(400).json({
          success: false,
          error: '企业名称、申请类型和入驻类型不能为空',
        });
      }

      const result = await db.insert(settlementApplications).values({
        enterpriseName,
        contactPerson,
        contactPhone,
        applicationType,
        settlementType,
        approvalFormUrl,
        approvalStatus: 'pending',
        remarks,
      }).returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('创建申请失败:', error);
      res.status(500).json({
        success: false,
        error: '创建申请失败',
      });
    }
  },

  /**
   * 更新申请
   */
  async updateApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        enterpriseName, 
        contactPerson, 
        contactPhone, 
        applicationType, 
        settlementType, 
        approvalFormUrl,
        remarks 
      } = req.body;

      // 检查申请是否存在
      const existing = await db.select().from(settlementApplications).where(eq(settlementApplications.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有待提交状态才能修改
      if (existing[0].approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能修改待提交状态的申请',
        });
      }

      const result = await db.update(settlementApplications)
        .set({
          enterpriseName,
          contactPerson,
          contactPhone,
          applicationType,
          settlementType,
          approvalFormUrl,
          remarks,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('更新申请失败:', error);
      res.status(500).json({
        success: false,
        error: '更新申请失败',
      });
    }
  },

  /**
   * 提交审批
   */
  async submitApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查申请是否存在
      const existing = await db.select().from(settlementApplications).where(eq(settlementApplications.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing[0].approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能提交待提交状态的申请',
        });
      }

      const result = await db.update(settlementApplications)
        .set({
          approvalStatus: 'submitted',
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('提交审批失败:', error);
      res.status(500).json({
        success: false,
        error: '提交审批失败',
      });
    }
  },

  /**
   * 审批通过
   */
  async approveApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { addressId } = req.body;

      // 检查申请是否存在
      const existing = await db.select().from(settlementApplications).where(eq(settlementApplications.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing[0].approvalStatus !== 'submitted') {
        return res.status(400).json({
          success: false,
          error: '只能审批已提交的申请',
        });
      }

      // 如果指定了地址，检查地址是否可用
      if (addressId) {
        const address = await db.select().from(registeredAddresses).where(eq(registeredAddresses.id, addressId));
        if (address.length === 0) {
          return res.status(404).json({
            success: false,
            error: '地址不存在',
          });
        }
        if (address[0].status !== 'available') {
          return res.status(400).json({
            success: false,
            error: '地址不可用',
          });
        }
      }

      // 更新申请状态
      const applicationResult = await db.update(settlementApplications)
        .set({
          approvalStatus: 'approved',
          approvalDate: new Date(),
          addressId: addressId || null,
          addressAssignedAt: addressId ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      // 如果分配了地址，更新地址状态
      if (addressId) {
        await db.update(registeredAddresses)
          .set({
            status: 'assigned',
            updatedAt: new Date(),
          })
          .where(eq(registeredAddresses.id, addressId));
      }

      // 创建入驻流程
      const stages = existing[0].applicationType === 'new' ? NEW_ENTERPRISE_STAGES : MIGRATION_STAGES;
      const initialStageProgress = stages.map(s => ({
        stage: s.stage,
        status: s.stage === 'approved' ? 'completed' : 'pending',
        startedAt: s.stage === 'approved' ? new Date().toISOString() : undefined,
        completedAt: s.stage === 'approved' ? new Date().toISOString() : undefined,
      }));

      await db.insert(settlementProcesses).values({
        applicationId: id,
        processType: existing[0].applicationType,
        currentStage: addressId ? 'address_assigned' : 'approved',
        stageProgress: initialStageProgress,
        startedAt: new Date(),
      });

      res.json({
        success: true,
        data: applicationResult[0],
      });
    } catch (error) {
      console.error('审批通过失败:', error);
      res.status(500).json({
        success: false,
        error: '审批通过失败',
      });
    }
  },

  /**
   * 审批驳回
   */
  async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      // 检查申请是否存在
      const existing = await db.select().from(settlementApplications).where(eq(settlementApplications.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing[0].approvalStatus !== 'submitted') {
        return res.status(400).json({
          success: false,
          error: '只能驳回已提交的申请',
        });
      }

      const result = await db.update(settlementApplications)
        .set({
          approvalStatus: 'rejected',
          approvalDate: new Date(),
          rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error('审批驳回失败:', error);
      res.status(500).json({
        success: false,
        error: '审批驳回失败',
      });
    }
  },

  /**
   * 删除申请
   */
  async deleteApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查申请是否存在
      const existing = await db.select().from(settlementApplications).where(eq(settlementApplications.id, id));
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有待提交状态才能删除
      if (existing[0].approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能删除待提交状态的申请',
        });
      }

      await db.delete(settlementApplications).where(eq(settlementApplications.id, id));

      res.json({
        success: true,
        message: '申请已删除',
      });
    } catch (error) {
      console.error('删除申请失败:', error);
      res.status(500).json({
        success: false,
        error: '删除申请失败',
      });
    }
  },

  /**
   * 获取统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const total = await db.select({ count: sql<number>`count(*)::int` }).from(settlementApplications);
      const pending = await db.select({ count: sql<number>`count(*)::int` }).from(settlementApplications).where(eq(settlementApplications.approvalStatus, 'pending'));
      const submitted = await db.select({ count: sql<number>`count(*)::int` }).from(settlementApplications).where(eq(settlementApplications.approvalStatus, 'submitted'));
      const approved = await db.select({ count: sql<number>`count(*)::int` }).from(settlementApplications).where(eq(settlementApplications.approvalStatus, 'approved'));
      const rejected = await db.select({ count: sql<number>`count(*)::int` }).from(settlementApplications).where(eq(settlementApplications.approvalStatus, 'rejected'));

      res.json({
        success: true,
        data: {
          total: total[0]?.count || 0,
          pending: pending[0]?.count || 0,
          submitted: submitted[0]?.count || 0,
          approved: approved[0]?.count || 0,
          rejected: rejected[0]?.count || 0,
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
