import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const ledgerController = {
  async getLedgers(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const customerId = req.query.customerId as string;
      const accountantId = req.query.accountantId as string;

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = client.from('ledgers').select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (accountantId) {
        query = query.eq('accountant_id', accountantId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取账套列表失败:', error);
        return res.status(500).json(errorResponse('获取账套列表失败'));
      }

      return res.json(paginatedResponse(data || [], count || 0, page, pageSize));
    } catch (error) {
      console.error('获取账套列表失败:', error);
      return res.status(500).json(errorResponse('获取账套列表失败'));
    }
  },

  async createLedger(req: Request, res: Response) {
    try {
      const body = req.body;
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('ledgers')
        .insert(body)
        .select()
        .single();

      if (error) {
        console.error('创建账套失败:', error);
        return res.status(500).json(errorResponse('创建账套失败'));
      }

      return res.json(successResponse(data, '创建账套成功'));
    } catch (error) {
      console.error('创建账套失败:', error);
      return res.status(500).json(errorResponse('创建账套失败'));
    }
  },
};
