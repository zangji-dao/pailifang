import { Request, Response } from 'express';
import { db, settlementApplications, settlementProcesses, registeredAddresses, eq, desc, and } from '../database/client';
import type { Shareholder, Attachment, StageProgress, Personnel } from '../database/schema';

// 流程阶段定义
const NEW_ENTERPRISE_STAGES: StageProgress[] = [
  { stage: 'approved', stageName: '审批通过', stageIndex: 0, status: 'pending' },
  { stage: 'address_assigned', stageName: '地址已分配', stageIndex: 1, status: 'pending' },
  { stage: 'pre_approval', stageName: '预核准', stageIndex: 2, status: 'pending' },
  { stage: 'pre_approval_done', stageName: '前置审批', stageIndex: 3, status: 'pending' },
  { stage: 'registered', stageName: '企业注册', stageIndex: 4, status: 'pending' },
  { stage: 'seal_made', stageName: '公章办理', stageIndex: 5, status: 'pending' },
  { stage: 'contract_pending', stageName: '待签合同', stageIndex: 6, status: 'pending' },
  { stage: 'completed', stageName: '入驻完成', stageIndex: 7, status: 'pending' },
];

const MIGRATION_STAGES: StageProgress[] = [
  { stage: 'approved', stageName: '审批通过', stageIndex: 0, status: 'pending' },
  { stage: 'address_assigned', stageName: '地址已分配', stageIndex: 1, status: 'pending' },
  { stage: 'contract_pending', stageName: '待签合同', stageIndex: 2, status: 'pending' },
  { stage: 'completed', stageName: '入驻完成', stageIndex: 3, status: 'pending' },
];

// 生成申请编号
function generateApplicationNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${year}${month}${day}-${random}`;
}

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const applicationController = {
  /**
   * 获取申请列表
   */
  async getApplications(req: Request, res: Response) {
    try {
      const approvalStatus = req.query.approvalStatus as string;
      const applicationType = req.query.applicationType as string;
      const status = req.query.status as string;

      const conditions = [];
      if (approvalStatus) {
        conditions.push(eq(settlementApplications.approvalStatus, approvalStatus));
      }
      if (applicationType) {
        conditions.push(eq(settlementApplications.applicationType, applicationType));
      }
      if (status) {
        conditions.push(eq(settlementApplications.status, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: settlementApplications.id,
          applicationNo: settlementApplications.applicationNo,
          applicationDate: settlementApplications.applicationDate,
          enterpriseName: settlementApplications.enterpriseName,
          enterpriseNameBackups: settlementApplications.enterpriseNameBackups,
          applicationType: settlementApplications.applicationType,
          settlementType: settlementApplications.settlementType,
          approvalStatus: settlementApplications.approvalStatus,
          approvedAt: settlementApplications.approvedAt,
          rejectionReason: settlementApplications.rejectionReason,
          assignedAddress: settlementApplications.assignedAddress,
          legalPersonName: settlementApplications.legalPersonName,
          legalPersonPhone: settlementApplications.legalPersonPhone,
          contactPersonName: settlementApplications.contactPersonName,
          contactPersonPhone: settlementApplications.contactPersonPhone,
          status: settlementApplications.status,
          createdAt: settlementApplications.createdAt,
        })
        .from(settlementApplications)
        .where(whereClause)
        .orderBy(desc(settlementApplications.createdAt));

      res.json({
        success: true,
        data: data,
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
   * 获取单个申请详情
   */
  async getApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const application = result[0];

      // 获取关联的流程信息
      const processResult = await db
        .select()
        .from(settlementProcesses)
        .where(eq(settlementProcesses.applicationId, id))
        .limit(1);

      res.json({
        success: true,
        data: {
          ...application,
          process: processResult[0] || null,
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
   * 创建申请（填写审批表）
   */
  async createApplication(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.enterpriseName || !data.applicationType) {
        return res.status(400).json({
          success: false,
          error: '企业名称和申请类型不能为空',
        });
      }

      const applicationNo = data.applicationNo || generateApplicationNo();
      const id = generateUUID();

      const result = await db
        .insert(settlementApplications)
        .values({
          id,
          applicationNo,
          applicationDate: data.applicationDate || new Date().toISOString().split('T')[0],
          enterpriseName: data.enterpriseName,
          enterpriseNameBackups: data.enterpriseNameBackups || [],
          registeredCapital: data.registeredCapital,
          currencyType: data.currencyType || 'CNY',
          taxType: data.taxType,
          expectedAnnualRevenue: data.expectedAnnualRevenue,
          expectedAnnualTax: data.expectedAnnualTax,
          originalRegisteredAddress: data.originalRegisteredAddress,
          mailingAddress: data.mailingAddress,
          businessAddress: data.businessAddress,
          legalPersonName: data.legalPersonName,
          legalPersonPhone: data.legalPersonPhone,
          legalPersonEmail: data.legalPersonEmail,
          legalPersonAddress: data.legalPersonAddress,
          shareholders: data.shareholders || [],
          personnel: data.personnel || [],
          supervisorName: data.supervisorName,
          supervisorPhone: data.supervisorPhone,
          financeManagerName: data.financeManagerName,
          financeManagerPhone: data.financeManagerPhone,
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          ewtContactName: data.ewtContactName,
          ewtContactPhone: data.ewtContactPhone,
          intermediaryDepartment: data.intermediaryDepartment,
          intermediaryName: data.intermediaryName,
          intermediaryPhone: data.intermediaryPhone,
          businessScope: data.businessScope,
          applicationType: data.applicationType,
          settlementType: data.settlementType,
          attachments: data.attachments || [],
          remarks: data.remarks,
          approvalStatus: 'draft',
          status: 'draft',
        })
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '申请创建成功',
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
      const data = req.body;

      const existingResult = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (existingResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const existing = existingResult[0];

      if (!['draft', 'rejected'].includes(existing.approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: '只能修改草稿或已驳回的申请',
        });
      }

      const result = await db
        .update(settlementApplications)
        .set({
          enterpriseName: data.enterpriseName,
          enterpriseNameBackups: data.enterpriseNameBackups || [],
          registeredCapital: data.registeredCapital,
          currencyType: data.currencyType,
          taxType: data.taxType,
          expectedAnnualRevenue: data.expectedAnnualRevenue,
          expectedAnnualTax: data.expectedAnnualTax,
          originalRegisteredAddress: data.originalRegisteredAddress,
          mailingAddress: data.mailingAddress,
          businessAddress: data.businessAddress,
          legalPersonName: data.legalPersonName,
          legalPersonPhone: data.legalPersonPhone,
          legalPersonEmail: data.legalPersonEmail,
          legalPersonAddress: data.legalPersonAddress,
          shareholders: data.shareholders,
          personnel: data.personnel,
          supervisorName: data.supervisorName,
          supervisorPhone: data.supervisorPhone,
          financeManagerName: data.financeManagerName,
          financeManagerPhone: data.financeManagerPhone,
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          ewtContactName: data.ewtContactName,
          ewtContactPhone: data.ewtContactPhone,
          intermediaryDepartment: data.intermediaryDepartment,
          intermediaryName: data.intermediaryName,
          intermediaryPhone: data.intermediaryPhone,
          businessScope: data.businessScope,
          applicationType: data.applicationType,
          settlementType: data.settlementType,
          attachments: data.attachments,
          remarks: data.remarks,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '申请更新成功',
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

      const existingResult = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (existingResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const existing = existingResult[0];

      if (!['draft', 'rejected'].includes(existing.approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: '只能提交草稿或已驳回的申请',
        });
      }

      const result = await db
        .update(settlementApplications)
        .set({
          approvalStatus: 'pending',
          status: 'submitted',
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '申请已提交审批',
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
      const { addressId, approvalOpinion } = req.body;

      const existingResult = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (existingResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const existing = existingResult[0];

      if (existing.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能审批待审批状态的申请',
        });
      }

      let assignedAddress = null;

      if (addressId) {
        const addressResult = await db
          .select()
          .from(registeredAddresses)
          .where(eq(registeredAddresses.id, addressId))
          .limit(1);

        if (addressResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: '地址不存在',
          });
        }

        const address = addressResult[0];
        if (address.status !== 'available') {
          return res.status(400).json({
            success: false,
            error: '地址不可用',
          });
        }
        assignedAddress = address.fullAddress;

        await db
          .update(registeredAddresses)
          .set({
            status: 'assigned',
            applicationId: id,
            assignedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(registeredAddresses.id, addressId));
      }

      const applicationResult = await db
        .update(settlementApplications)
        .set({
          approvalStatus: 'approved',
          status: 'processing',
          approvalOpinion: approvalOpinion,
          approvedAt: new Date(),
          assignedAddressId: addressId || null,
          assignedAddress: assignedAddress,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      const stages = existing.applicationType === 'new'
        ? JSON.parse(JSON.stringify(NEW_ENTERPRISE_STAGES))
        : JSON.parse(JSON.stringify(MIGRATION_STAGES));

      stages[0].status = 'completed';
      stages[0].startedAt = new Date().toISOString();
      stages[0].completedAt = new Date().toISOString();

      if (addressId && stages.length > 1) {
        stages[1].status = 'completed';
        stages[1].startedAt = new Date().toISOString();
        stages[1].completedAt = new Date().toISOString();
      }

      const currentStageIndex = addressId ? 1 : 0;
      await db.insert(settlementProcesses).values({
        id: generateUUID(),
        applicationId: id,
        enterpriseName: existing.enterpriseName,
        processType: existing.applicationType,
        currentStage: stages[currentStageIndex].stage,
        currentStageIndex: currentStageIndex,
        overallStatus: 'in_progress',
        stages: stages,
        startedAt: new Date(),
      });

      res.json({
        success: true,
        data: applicationResult[0],
        message: '审批通过',
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

      const existingResult = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (existingResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const existing = existingResult[0];

      if (existing.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能驳回待审批状态的申请',
        });
      }

      const result = await db
        .update(settlementApplications)
        .set({
          approvalStatus: 'rejected',
          rejectionReason: rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      res.json({
        success: true,
        data: result[0],
        message: '申请已驳回',
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

      const existingResult = await db
        .select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id))
        .limit(1);

      if (existingResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const existing = existingResult[0];

      // 只允许删除填报中、待审批、已驳回状态的申请
      if (!['filling', 'pending', 'rejected'].includes(existing.approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: '只能删除填报中、待审批或已驳回状态的申请',
        });
      }

      await db
        .delete(settlementApplications)
        .where(eq(settlementApplications.id, id));

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
      const data = await db
        .select({ approvalStatus: settlementApplications.approvalStatus })
        .from(settlementApplications);

      const result = {
        total: data.length,
        draft: data.filter((d) => d.approvalStatus === 'draft').length,
        pending: data.filter((d) => d.approvalStatus === 'pending').length,
        approved: data.filter((d) => d.approvalStatus === 'approved').length,
        rejected: data.filter((d) => d.approvalStatus === 'rejected').length,
      };

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
