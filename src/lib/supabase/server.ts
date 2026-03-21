import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 创建服务器端Supabase客户端
 * 用于API路由中访问数据库
 */
export function createClient() {
  return getSupabaseClient();
}
