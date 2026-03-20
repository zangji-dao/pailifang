/**
 * API 代理：/api/storage/* → 后端服务
 */

import { createApiProxy } from '@/lib/api-proxy';

// 增加请求体大小限制
export const runtime = 'nodejs';

export const { GET, POST, PUT, PATCH, DELETE } = createApiProxy({
  routePrefix: '/api/storage',
});
