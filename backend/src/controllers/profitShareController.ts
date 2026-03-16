import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const profitShareController = {
  async getProfitShares(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const period = req.query.period as string;
      const salesId = req.query.salesId as string;
      const accountantId = req.query.accountantId as string;

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = client.from('profit_shares').select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (period) {
        query = query.eq('period', period);
      }

      if (salesId) {
        query = query.eq('sales_id', salesId);
      }

      if (accountantId) {
        query = query.eq('accountant_id', accountantId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取分润列表失败:', error);
        return res.status(500).json(errorResponse('获取分润列表失败'));
      }

      return res.json(paginatedResponse(data || [], count || 0, page, pageSize));
    } catch (error) {
      console.error('获取分润列表失败:', error);
      return res.status(500).json(errorResponse('获取分润列表失败'));
    }
  },

  async createProfitShare(req: Request, res: Response) {
    try {
      const body = req.body;
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('profit_shares')
        .insert(body)
        .select()
        .single();

      if (error) {
        console.error('创建分润记录失败:', error);
        return res.status(500).json(errorResponse('创建分润记录失败'));
      }

      return res.json(successResponse(data, '创建分润记录成功'));
    } catch (error) {
      console.error('创建分润记录失败:', error);
      return res.status(500).json(errorResponse('创建分润记录失败'));
    }
  },

  async updateProfitShareStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const client = getSupabaseClient();

      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await client
        .from('profit_shares')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新分润状态失败:', error);
        return res.status(500).json(errorResponse('更新分润状态失败'));
      }

      return res.json(successResponse(data, '更新分润状态成功'));
    } catch (error) {
      console.error('更新分润状态失败:', error);
      return res.status(500).json(errorResponse('更新分润状态失败'));
    }
  },
};
