/**
 * API 代理工具
 * 用于 Next.js API Routes 代理到后端服务
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

/**
 * 代理请求选项
 */
interface ProxyOptions {
  /** 路由前缀，如 /api/bases */
  routePrefix: string;
}

/**
 * 创建 API 代理处理器
 */
export function createApiProxy(options: ProxyOptions) {
  const { routePrefix } = options;

  /**
   * 代理单个请求
   */
  async function proxyRequest(
    request: NextRequest,
    method: string
  ): Promise<NextResponse> {
    try {
      // 构建目标 URL
      const path = request.nextUrl.pathname.replace(routePrefix, '');
      const searchParams = request.nextUrl.searchParams.toString();
      const backendUrl = config.backend.baseUrl;
      const url = `${backendUrl}/api${routePrefix.replace('/api', '')}${path}${searchParams ? `?${searchParams}` : ''}`;

      // 构建请求头
      const headers: HeadersInit = {};
      
      // 转发 Content-Type（对文件上传很重要）
      const contentType = request.headers.get('Content-Type');
      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      // 转发 Authorization 头
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      // 构建请求选项
      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      // 处理请求体 - 直接使用流式转发，绕过 Next.js 大小限制
      if (method !== 'GET' && method !== 'DELETE' && request.body) {
        // 直接转发请求体流，不读取整个内容
        fetchOptions.body = request.body;
      }

      // 发送请求
      const response = await fetch(url, fetchOptions);

      // 解析响应
      let data: unknown;
      const responseContentType = response.headers.get('content-type');
      if (responseContentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('API 代理错误:', error);
      return NextResponse.json(
        { success: false, error: 'API 代理请求失败' },
        { status: 500 }
      );
    }
  }

  // 返回 HTTP 方法处理器
  return {
    GET: (request: NextRequest) => proxyRequest(request, 'GET'),
    POST: (request: NextRequest) => proxyRequest(request, 'POST'),
    PUT: (request: NextRequest) => proxyRequest(request, 'PUT'),
    PATCH: (request: NextRequest) => proxyRequest(request, 'PATCH'),
    DELETE: (request: NextRequest) => proxyRequest(request, 'DELETE'),
  };
}
