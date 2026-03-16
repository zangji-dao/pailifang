import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const workOrderController = {
  async getWorkOrders(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const assignedTo = req.query.assignedTo as string;

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = client.from('work_orders').select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取工单列表失败:', error);
        return res.status(500).json(errorResponse('获取工单列表失败'));
      }

      return res.json(paginatedResponse(data || [], count || 0, page, pageSize));
    } catch (error) {
      console.error('获取工单列表失败:', error);
      return res.status(500).json(errorResponse('获取工单列表失败'));
    }
  },

  async createWorkOrder(req: Request, res: Response) {
    try {
      const body = req.body;
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('work_orders')
        .insert(body)
        .select()
        .single();

      if (error) {
        console.error('创建工单失败:', error);
        return res.status(500).json(errorResponse('创建工单失败'));
      }

      return res.json(successResponse(data, '创建工单成功'));
    } catch (error) {
      console.error('创建工单失败:', error);
      return res.status(500).json(errorResponse('创建工单失败'));
    }
  },

  async updateWorkOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const client = getSupabaseClient();

      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await client
        .from('work_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新工单状态失败:', error);
        return res.status(500).json(errorResponse('更新工单状态失败'));
      }

      return res.json(successResponse(data, '更新工单状态成功'));
    } catch (error) {
      console.error('更新工单状态失败:', error);
      return res.status(500).json(errorResponse('更新工单状态失败'));
    }
  },
};
