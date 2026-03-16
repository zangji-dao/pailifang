import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

/**
 * 会计科目 Controller
 * 处理科目的增删改查操作
 */
export const accountController = {
  /**
   * 获取科目列表
   * GET /api/accounts?ledgerId=xxx&type=asset
   */
  async getAccounts(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      
      const ledgerId = req.query.ledgerId as string;
      const type = req.query.type as string;
      const parentId = req.query.parentId as string;
      const isActive = req.query.isActive as string;
      const search = req.query.search as string;

      let query = client.from('chart_of_accounts').select('*');

      if (ledgerId) {
        query = query.eq('ledger_id', ledgerId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (parentId !== undefined) {
        if (parentId === 'null' || parentId === '') {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', parentId);
        }
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive === 'true');
      }

      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
      }

      const { data, error } = await query.order('code', { ascending: true });

      if (error) {
        console.error('获取科目列表失败:', error);
        return res.status(500).json(errorResponse('获取科目列表失败'));
      }

      return res.json(successResponse(data || [], '获取科目列表成功'));
    } catch (error) {
      console.error('获取科目列表失败:', error);
      return res.status(500).json(errorResponse('获取科目列表失败'));
    }
  },

  /**
   * 获取单个科目详情
   * GET /api/accounts/:id
   */
  async getAccountById(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      const { id } = req.params;

      const { data, error } = await client
        .from('chart_of_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取科目详情失败:', error);
        return res.status(404).json(errorResponse('科目不存在'));
      }

      return res.json(successResponse(data, '获取科目详情成功'));
    } catch (error) {
      console.error('获取科目详情失败:', error);
      return res.status(500).json(errorResponse('获取科目详情失败'));
    }
  },

  /**
   * 创建科目
   * POST /api/accounts
   */
  async createAccount(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      const body = req.body;

      // 检查编码是否已存在
      const { data: existing } = await client
        .from('chart_of_accounts')
        .select('id')
        .eq('ledger_id', body.ledgerId)
        .eq('code', body.code)
        .single();

      if (existing) {
        return res.status(400).json(errorResponse('科目编码已存在'));
      }

      // 计算科目层级
      let level = 1;
      if (body.parentId) {
        const { data: parent } = await client
          .from('chart_of_accounts')
          .select('level')
          .eq('id', body.parentId)
          .single();
        
        if (parent) {
          level = parent.level + 1;
          
          // 更新父节点为非叶子节点
          await client
            .from('chart_of_accounts')
            .update({ is_leaf: false })
            .eq('id', body.parentId);
        }
      }

      const accountData = {
        ...body,
        level,
        is_leaf: true,
      };

      const { data, error } = await client
        .from('chart_of_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) {
        console.error('创建科目失败:', error);
        return res.status(500).json(errorResponse('创建科目失败'));
      }

      return res.json(successResponse(data, '创建科目成功'));
    } catch (error) {
      console.error('创建科目失败:', error);
      return res.status(500).json(errorResponse('创建科目失败'));
    }
  },

  /**
   * 更新科目
   * PUT /api/accounts/:id
   */
  async updateAccount(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      const { id } = req.params;
      const body = req.body;

      // 检查科目是否存在
      const { data: existing } = await client
        .from('chart_of_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('科目不存在'));
      }

      // 如果是系统预设科目（一级科目），只允许修改状态
      if (existing.level === 1) {
        const allowedFields = ['isActive', 'remark'];
        const updateData: Record<string, unknown> = {};
        
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        }
        
        updateData.updatedAt = new Date().toISOString();

        const { data, error } = await client
          .from('chart_of_accounts')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('更新科目失败:', error);
          return res.status(500).json(errorResponse('更新科目失败'));
        }

        return res.json(successResponse(data, '更新科目成功'));
      }

      // 明细科目可以修改更多信息
      const updateData = {
        name: body.name,
        isActive: body.isActive,
        remark: body.remark,
        updatedAt: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('chart_of_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新科目失败:', error);
        return res.status(500).json(errorResponse('更新科目失败'));
      }

      return res.json(successResponse(data, '更新科目成功'));
    } catch (error) {
      console.error('更新科目失败:', error);
      return res.status(500).json(errorResponse('更新科目失败'));
    }
  },

  /**
   * 删除科目
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      const { id } = req.params;

      // 检查科目是否存在
      const { data: existing } = await client
        .from('chart_of_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('科目不存在'));
      }

      // 一级科目不允许删除
      if (existing.level === 1) {
        return res.status(400).json(errorResponse('系统预设科目不允许删除'));
      }

      // 检查是否有下级科目
      const { data: children } = await client
        .from('chart_of_accounts')
        .select('id')
        .eq('parent_id', id);

      if (children && children.length > 0) {
        return res.status(400).json(errorResponse('存在下级科目，无法删除'));
      }

      // 检查是否在凭证中使用
      const { data: entries } = await client
        .from('voucher_entries')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (entries && entries.length > 0) {
        return res.status(400).json(errorResponse('科目已在凭证中使用，无法删除'));
      }

      const { error } = await client
        .from('chart_of_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除科目失败:', error);
        return res.status(500).json(errorResponse('删除科目失败'));
      }

      return res.json(successResponse(null, '删除科目成功'));
    } catch (error) {
      console.error('删除科目失败:', error);
      return res.status(500).json(errorResponse('删除科目失败'));
    }
  },

  /**
   * 批量操作
   * POST /api/accounts/batch
   */
  async batchOperation(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      const { action, ids } = req.body;

      if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(errorResponse('参数错误'));
      }

      let result;

      switch (action) {
        case 'enable':
          result = await client
            .from('chart_of_accounts')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .in('id', ids);
          break;

        case 'disable':
          result = await client
            .from('chart_of_accounts')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .in('id', ids);
          break;

        default:
          return res.status(400).json(errorResponse('不支持的操作类型'));
      }

      if (result.error) {
        console.error('批量操作失败:', result.error);
        return res.status(500).json(errorResponse('批量操作失败'));
      }

      return res.json(successResponse(null, '批量操作成功'));
    } catch (error) {
      console.error('批量操作失败:', error);
      return res.status(500).json(errorResponse('批量操作失败'));
    }
  },
};
