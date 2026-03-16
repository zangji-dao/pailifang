import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const customerController = {
  async getCustomers(req: Request, res: Response) {
    try {
      const client = getSupabaseClient();
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = client.from('customers').select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取客户列表失败:', error);
        return res.status(500).json(errorResponse('获取客户列表失败'));
      }

      return res.json(paginatedResponse(data || [], count || 0, page, pageSize));
    } catch (error) {
      console.error('获取客户列表失败:', error);
      return res.status(500).json(errorResponse('获取客户列表失败'));
    }
  },

  async createCustomer(req: Request, res: Response) {
    try {
      const body = req.body;
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('customers')
        .insert(body)
        .select()
        .single();

      if (error) {
        console.error('创建客户失败:', error);
        return res.status(500).json(errorResponse('创建客户失败'));
      }

      return res.json(successResponse(data, '创建客户成功'));
    } catch (error) {
      console.error('创建客户失败:', error);
      return res.status(500).json(errorResponse('创建客户失败'));
    }
  },
};
