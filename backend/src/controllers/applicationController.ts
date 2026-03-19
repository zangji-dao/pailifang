import { Request, Response } from 'express';
import { getSupabaseClient } from '../database/client';
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
      const supabase = getSupabaseClient();
      const { approvalStatus, applicationType, status } = req.query;

      let query = supabase
        .from('pi_settlement_applications')
        .select('id, application_no, application_date, enterprise_name, enterprise_name_backup, application_type, settlement_type, approval_status, approved_at, assigned_address, legal_person_name, legal_person_phone, contact_person_name, contact_person_phone, status, created_at')
        .order('created_at', { ascending: false });

      if (approvalStatus) {
        query = query.eq('approval_status', approvalStatus);
      }
      if (applicationType) {
        query = query.eq('application_type', applicationType);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取申请列表失败:', error);
        return res.status(500).json({
          success: false,
          error: '获取申请列表失败',
        });
      }

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
      const supabase = getSupabaseClient();

      const { data: application, error: appError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (appError || !application) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 获取关联的流程信息
      const { data: process } = await supabase
        .from('pi_settlement_processes')
        .select('*')
        .eq('application_id', id)
        .single();

      res.json({
        success: true,
        data: {
          ...application,
          process: process || null,
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
      const supabase = getSupabaseClient();

      // 必填字段验证
      if (!data.enterpriseName || !data.applicationType) {
        return res.status(400).json({
          success: false,
          error: '企业名称和申请类型不能为空',
        });
      }

      // 生成申请编号
      const applicationNo = data.applicationNo || generateApplicationNo();
      const id = generateUUID();

      const insertData = {
        id,
        application_no: applicationNo,
        application_date: data.applicationDate || new Date().toISOString().split('T')[0],
        
        // 企业基本信息
        enterprise_name: data.enterpriseName,
        enterprise_name_backup: data.enterpriseNameBackup,
        registered_capital: data.registeredCapital,
        currency_type: data.currencyType || 'CNY',
        tax_type: data.taxType,
        
        // 预计经营数据
        expected_annual_revenue: data.expectedAnnualRevenue,
        expected_annual_tax: data.expectedAnnualTax,
        
        // 地址信息
        original_registered_address: data.originalRegisteredAddress,
        mailing_address: data.mailingAddress,
        business_address: data.businessAddress,
        
        // 法人信息
        legal_person_name: data.legalPersonName,
        legal_person_phone: data.legalPersonPhone,
        legal_person_email: data.legalPersonEmail,
        legal_person_address: data.legalPersonAddress,
        
        // 股东信息
        shareholders: data.shareholders || [],
        
        // 人员信息（新版）
        personnel: data.personnel || [],
        
        // 监事信息
        supervisor_name: data.supervisorName,
        supervisor_phone: data.supervisorPhone,
        
        // 财务负责人信息
        finance_manager_name: data.financeManagerName,
        finance_manager_phone: data.financeManagerPhone,
        
        // 实际联络人信息
        contact_person_name: data.contactPersonName,
        contact_person_phone: data.contactPersonPhone,
        
        // e窗通联系人信息
        ewt_contact_name: data.ewtContactName,
        ewt_contact_phone: data.ewtContactPhone,
        
        // 中介信息
        intermediary_department: data.intermediaryDepartment,
        intermediary_name: data.intermediaryName,
        intermediary_phone: data.intermediaryPhone,
        
        // 经营范围
        business_scope: data.businessScope,
        
        // 申请类型
        application_type: data.applicationType,
        settlement_type: data.settlementType,
        
        // 附件
        attachments: data.attachments || [],
        
        // 其他
        remarks: data.remarks,
        
        // 状态
        approval_status: 'draft',
        status: 'draft',
      };

      const { data: result, error } = await supabase
        .from('pi_settlement_applications')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('创建申请失败:', error);
        return res.status(500).json({
          success: false,
          error: '创建申请失败',
        });
      }

      res.json({
        success: true,
        data: result,
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
      const supabase = getSupabaseClient();

      // 检查申请是否存在
      const { data: existing, error: existError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有草稿和驳回状态才能修改
      if (!['draft', 'rejected'].includes(existing.approval_status)) {
        return res.status(400).json({
          success: false,
          error: '只能修改草稿或已驳回的申请',
        });
      }

      const updateData = {
        // 企业基本信息
        enterprise_name: data.enterpriseName,
        enterprise_name_backup: data.enterpriseNameBackup,
        registered_capital: data.registeredCapital,
        currency_type: data.currencyType,
        tax_type: data.taxType,
        
        // 预计经营数据
        expected_annual_revenue: data.expectedAnnualRevenue,
        expected_annual_tax: data.expectedAnnualTax,
        
        // 地址信息
        original_registered_address: data.originalRegisteredAddress,
        mailing_address: data.mailingAddress,
        business_address: data.businessAddress,
        
        // 法人信息
        legal_person_name: data.legalPersonName,
        legal_person_phone: data.legalPersonPhone,
        legal_person_email: data.legalPersonEmail,
        legal_person_address: data.legalPersonAddress,
        
        // 股东信息
        shareholders: data.shareholders,
        
        // 人员信息（新版）
        personnel: data.personnel,
        
        // 监事信息
        supervisor_name: data.supervisorName,
        supervisor_phone: data.supervisorPhone,
        
        // 财务负责人信息
        finance_manager_name: data.financeManagerName,
        finance_manager_phone: data.financeManagerPhone,
        
        // 实际联络人信息
        contact_person_name: data.contactPersonName,
        contact_person_phone: data.contactPersonPhone,
        
        // e窗通联系人信息
        ewt_contact_name: data.ewtContactName,
        ewt_contact_phone: data.ewtContactPhone,
        
        // 中介信息
        intermediary_department: data.intermediaryDepartment,
        intermediary_name: data.intermediaryName,
        intermediary_phone: data.intermediaryPhone,
        
        // 经营范围
        business_scope: data.businessScope,
        
        // 申请类型
        application_type: data.applicationType,
        settlement_type: data.settlementType,
        
        // 附件
        attachments: data.attachments,
        
        // 其他
        remarks: data.remarks,
        
        // 更新时间
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('pi_settlement_applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新申请失败:', error);
        return res.status(500).json({
          success: false,
          error: '更新申请失败',
        });
      }

      res.json({
        success: true,
        data: result,
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
      const supabase = getSupabaseClient();

      const { data: existing, error: existError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (!['draft', 'rejected'].includes(existing.approval_status)) {
        return res.status(400).json({
          success: false,
          error: '只能提交草稿或已驳回的申请',
        });
      }

      const { data: result, error } = await supabase
        .from('pi_settlement_applications')
        .update({
          approval_status: 'pending',
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('提交审批失败:', error);
        return res.status(500).json({
          success: false,
          error: '提交审批失败',
        });
      }

      res.json({
        success: true,
        data: result,
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
      const supabase = getSupabaseClient();

      const { data: existing, error: existError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing.approval_status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能审批待审批状态的申请',
        });
      }

      let assignedAddress = null;

      // 如果指定了地址，检查地址是否可用
      if (addressId) {
        const { data: address, error: addrError } = await supabase
          .from('pi_registered_addresses')
          .select('*')
          .eq('id', addressId)
          .single();

        if (addrError || !address) {
          return res.status(404).json({
            success: false,
            error: '地址不存在',
          });
        }
        if (address.status !== 'available') {
          return res.status(400).json({
            success: false,
            error: '地址不可用',
          });
        }
        assignedAddress = address.full_address;

        // 更新地址状态
        await supabase
          .from('pi_registered_addresses')
          .update({
            status: 'assigned',
            application_id: id,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', addressId);
      }

      // 更新申请状态
      const { data: applicationResult, error: updateError } = await supabase
        .from('pi_settlement_applications')
        .update({
          approval_status: 'approved',
          status: 'processing',
          approval_opinion: approvalOpinion,
          approved_at: new Date().toISOString(),
          assigned_address_id: addressId || null,
          assigned_address: assignedAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('审批通过失败:', updateError);
        return res.status(500).json({
          success: false,
          error: '审批通过失败',
        });
      }

      // 初始化流程阶段
      const stages = existing.application_type === 'new' 
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
      await supabase
        .from('pi_settlement_processes')
        .insert({
          id: generateUUID(),
          application_id: id,
          enterprise_name: existing.enterprise_name,
          process_type: existing.application_type,
          current_stage: stages[currentStageIndex].stage,
          current_stage_index: currentStageIndex,
          overall_status: 'in_progress',
          stages: stages,
          started_at: new Date().toISOString(),
        });

      res.json({
        success: true,
        data: applicationResult,
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
      const supabase = getSupabaseClient();

      const { data: existing, error: existError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      if (existing.approval_status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: '只能驳回待审批状态的申请',
        });
      }

      const { data: result, error } = await supabase
        .from('pi_settlement_applications')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('审批驳回失败:', error);
        return res.status(500).json({
          success: false,
          error: '审批驳回失败',
        });
      }

      res.json({
        success: true,
        data: result,
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
      const supabase = getSupabaseClient();

      const { data: existing, error: existError } = await supabase
        .from('pi_settlement_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({
          success: false,
          error: '申请不存在',
        });
      }

      // 只有草稿状态才能删除
      if (existing.approval_status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: '只能删除草稿状态的申请',
        });
      }

      const { error } = await supabase
        .from('pi_settlement_applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除申请失败:', error);
        return res.status(500).json({
          success: false,
          error: '删除申请失败',
        });
      }

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
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('pi_settlement_applications')
        .select('approval_status');

      if (error) {
        console.error('获取统计信息失败:', error);
        return res.status(500).json({
          success: false,
          error: '获取统计信息失败',
        });
      }

      const result = {
        total: data.length,
        draft: data.filter((d: any) => d.approval_status === 'draft').length,
        pending: data.filter((d: any) => d.approval_status === 'pending').length,
        approved: data.filter((d: any) => d.approval_status === 'approved').length,
        rejected: data.filter((d: any) => d.approval_status === 'rejected').length,
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
