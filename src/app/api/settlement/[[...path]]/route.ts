/**
 * API 代理：/api/settlement/* → 后端服务
 */

import { createApiProxy } from '@/lib/api-proxy';

export const { GET, POST, PUT, PATCH, DELETE } = createApiProxy({
  routePrefix: '/api/settlement',
});
