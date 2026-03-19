import { Request, Response } from 'express';
import { db } from '../database/client';
import { settlementApplications, settlementProcesses, registeredAddresses, enterprises } from '../database/schema';
import { eq, sql, desc, and, isNull } from 'drizzle-orm';
import type { Shareholder, Attachment, StageProgress } from '../database/schema';

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

export const applicationController = {
  /**
   * 获取申请列表
   */
  async getApplications(req: Request, res: Response) {
    try {
      const { approvalStatus, applicationType, status } = req.query;

      let query = db.select({
        id: settlementApplications.id,
        applicationNo: settlementApplications.applicationNo,
        applicationDate: settlementApplications.applicationDate,
        enterpriseName: settlementApplications.enterpriseName,
        enterpriseNameBackup: settlementApplications.enterpriseNameBackup,
        applicationType: settlementApplications.applicationType,
        settlementType: settlementApplications.settlementType,
        approvalStatus: settlementApplications.approvalStatus,
        approvedAt: settlementApplications.approvedAt,
        assignedAddress: settlementApplications.assignedAddress,
        legalPersonName: settlementApplications.legalPersonName,
        legalPersonPhone: settlementApplications.legalPersonPhone,
        contactPersonName: settlementApplications.contactPersonName,
        contactPersonPhone: settlementApplications.contactPersonPhone,
        status: settlementApplications.status,
        createdAt: settlementApplications.createdAt,
      }).from(settlementApplications)
        .orderBy(desc(settlementApplications.createdAt));

      const results = await query;

      // 过滤
      let filtered = results;
      if (approvalStatus) {
        filtered = filtered.filter(a => a.approvalStatus === approvalStatus);
      }
      if (applicationType) {
        filtered = filtered.filter(a => a.applicationType === applicationType);
      }
      if (status) {
        filtered = filtered.filter(a => a.status === status);
      }

      res.json({
        success: true,
        data: filtered,
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

      const result = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      const application = result[0];

      // 获取关联的流程信息
      const processResult = await db.select()
        .from(settlementProcesses)
        .where(eq(settlementProcesses.applicationId, id));

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

      // 必填字段验证
      if (!data.enterpriseName || !data.applicationType) {
        return res.status(400).json({
          success: false,
          error: '企业名称和申请类型不能为空',
        });
      }

      // 生成申请编号
      const applicationNo = data.applicationNo || generateApplicationNo();

      const result = await db.insert(settlementApplications).values({
        applicationNo,
        applicationDate: data.applicationDate || new Date(),
        
        // 企业基本信息
        enterpriseName: data.enterpriseName,
        enterpriseNameBackup: data.enterpriseNameBackup,
        registeredCapital: data.registeredCapital,
        currencyType: data.currencyType || 'CNY',
        taxType: data.taxType,
        
        // 预计经营数据
        expectedAnnualRevenue: data.expectedAnnualRevenue,
        expectedAnnualTax: data.expectedAnnualTax,
        
        // 地址信息
        originalRegisteredAddress: data.originalRegisteredAddress,
        mailingAddress: data.mailingAddress,
        businessAddress: data.businessAddress,
        
        // 法人信息
        legalPersonName: data.legalPersonName,
        legalPersonPhone: data.legalPersonPhone,
        legalPersonEmail: data.legalPersonEmail,
        legalPersonAddress: data.legalPersonAddress,
        
        // 股东信息
        shareholders: data.shareholders || [],
        
        // 监事信息
        supervisorName: data.supervisorName,
        supervisorPhone: data.supervisorPhone,
        
        // 财务负责人信息
        financeManagerName: data.financeManagerName,
        financeManagerPhone: data.financeManagerPhone,
        
        // 实际联络人信息
        contactPersonName: data.contactPersonName,
        contactPersonPhone: data.contactPersonPhone,
        
        // e窗通联系人信息
        ewtContactName: data.ewtContactName,
        ewtContactPhone: data.ewtContactPhone,
        
        // 中介信息
        intermediaryDepartment: data.intermediaryDepartment,
        intermediaryName: data.intermediaryName,
        intermediaryPhone: data.intermediaryPhone,
        
        // 经营范围
        businessScope: data.businessScope,
        
        // 申请类型
        applicationType: data.applicationType,
        settlementType: data.settlementType,
        
        // 附件
        attachments: data.attachments || [],
        
        // 其他
        remarks: data.remarks,
        
        // 状态
        approvalStatus: 'draft',
        status: 'draft',
      }).returning();

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

      // 检查申请是否存在
      const existing = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有草稿和驳回状态才能修改
      if (!['draft', 'rejected'].includes(existing[0].approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: '只能修改草稿或已驳回的申请',
        });
      }

      const result = await db.update(settlementApplications)
        .set({
          // 企业基本信息
          enterpriseName: data.enterpriseName,
          enterpriseNameBackup: data.enterpriseNameBackup,
          registeredCapital: data.registeredCapital,
          currencyType: data.currencyType,
          taxType: data.taxType,
          
          // 预计经营数据
          expectedAnnualRevenue: data.expectedAnnualRevenue,
          expectedAnnualTax: data.expectedAnnualTax,
          
          // 地址信息
          originalRegisteredAddress: data.originalRegisteredAddress,
          mailingAddress: data.mailingAddress,
          businessAddress: data.businessAddress,
          
          // 法人信息
          legalPersonName: data.legalPersonName,
          legalPersonPhone: data.legalPersonPhone,
          legalPersonEmail: data.legalPersonEmail,
          legalPersonAddress: data.legalPersonAddress,
          
          // 股东信息
          shareholders: data.shareholders,
          
          // 监事信息
          supervisorName: data.supervisorName,
          supervisorPhone: data.supervisorPhone,
          
          // 财务负责人信息
          financeManagerName: data.financeManagerName,
          financeManagerPhone: data.financeManagerPhone,
          
          // 实际联络人信息
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          
          // e窗通联系人信息
          ewtContactName: data.ewtContactName,
          ewtContactPhone: data.ewtContactPhone,
          
          // 中介信息
          intermediaryDepartment: data.intermediaryDepartment,
          intermediaryName: data.intermediaryName,
          intermediaryPhone: data.intermediaryPhone,
          
          // 经营范围
          businessScope: data.businessScope,
          
          // 申请类型
          applicationType: data.applicationType,
          settlementType: data.settlementType,
          
          // 附件
          attachments: data.attachments,
          
          // 其他
          remarks: data.remarks,
          
          // 更新时间
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

      const existing = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (!['draft', 'rejected'].includes(existing[0].approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: '只能提交草稿或已驳回的申请',
        });
      }

      const result = await db.update(settlementApplications)
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

      const existing = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing[0].approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能审批待审批状态的申请',
        });
      }

      let assignedAddress = null;

      // 如果指定了地址，检查地址是否可用
      if (addressId) {
        const address = await db.select()
          .from(registeredAddresses)
          .where(eq(registeredAddresses.id, addressId));

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
        assignedAddress = address[0].fullAddress;

        // 更新地址状态
        await db.update(registeredAddresses)
          .set({
            status: 'assigned',
            applicationId: id,
            assignedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(registeredAddresses.id, addressId));
      }

      // 更新申请状态
      const applicationResult = await db.update(settlementApplications)
        .set({
          approvalStatus: 'approved',
          status: 'processing',
          approvalOpinion,
          approvedAt: new Date(),
          assignedAddressId: addressId || null,
          assignedAddress: assignedAddress,
          updatedAt: new Date(),
        })
        .where(eq(settlementApplications.id, id))
        .returning();

      // 初始化流程阶段
      const stages = existing[0].applicationType === 'new' 
        ? JSON.parse(JSON.stringify(NEW_ENTERPRISE_STAGES)) 
        : JSON.parse(JSON.stringify(MIGRATION_STAGES));
      
      // 标记第一阶段为完成
      stages[0].status = 'completed';
      stages[0].startedAt = new Date().toISOString();
      stages[0].completedAt = new Date().toISOString();

      // 如果分配了地址，标记第二阶段也完成
      if (addressId && stages.length > 1) {
        stages[1].status = 'completed';
        stages[1].startedAt = new Date().toISOString();
        stages[1].completedAt = new Date().toISOString();
      }

      // 创建入驻流程
      const currentStageIndex = addressId ? 1 : 0;
      await db.insert(settlementProcesses).values({
        applicationId: id,
        enterpriseName: existing[0].enterpriseName,
        processType: existing[0].applicationType,
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

      const existing = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing[0].approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能驳回待审批状态的申请',
        });
      }

      const result = await db.update(settlementApplications)
        .set({
          approvalStatus: 'rejected',
          rejectionReason,
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

      const existing = await db.select()
        .from(settlementApplications)
        .where(eq(settlementApplications.id, id));

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有草稿状态才能删除
      if (existing[0].approvalStatus !== 'draft') {
        return res.status(400).json({
          success: false,
          error: '只能删除草稿状态的申请',
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
      const stats = await db.select({
        approvalStatus: settlementApplications.approvalStatus,
        count: sql<number>`count(*)::int`,
      }).from(settlementApplications)
        .groupBy(settlementApplications.approvalStatus);

      const result = {
        total: 0,
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      stats.forEach(s => {
        result.total += s.count;
        if (s.approvalStatus === 'draft') result.draft = s.count;
        if (s.approvalStatus === 'pending') result.pending = s.count;
        if (s.approvalStatus === 'approved') result.approved = s.count;
        if (s.approvalStatus === 'rejected') result.rejected = s.count;
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
