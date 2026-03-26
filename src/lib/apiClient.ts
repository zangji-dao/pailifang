/**
 * API 客户端
 * 
 * 统一处理 API 调用，自动使用配置文件中的环境配置
 */

import config, { isDevelopment } from '@/config';

// API 响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取 API 基础 URL
 * 在沙箱环境中，通过 Next.js API Routes 代理请求到后端
 */
const getApiBaseUrl = (): string => {
  // 服务端渲染时：使用后端服务地址
  if (typeof window === 'undefined') {
    return config.backend.baseUrl;
  }

  // 客户端：使用相对路径（通过 Next.js API Routes 代理）
  const { protocol, hostname, port } = window.location;

  // 沙箱环境：使用相对路径，由 Next.js API Routes 代理到后端
  if (hostname.includes('dev.coze.site')) {
    return ''; // 空字符串表示使用相对路径
  }

  // 生产环境：通过域名访问（无端口）→ 使用 Nginx 代理
  if (!port || port === '80' || port === '443') {
    return `${protocol}//${hostname}`;
  }

  // 开发环境：直接访问后端
  return `${protocol}//${hostname}:4001`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * API 客户端类
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送请求
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 尝试解析 JSON
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export const API_BASE_URL_EXPORTED = API_BASE_URL;

// 导出环境判断函数
export const getCurrentEnvironment = (): 'sandbox' | 'production' => {
  if (typeof window === 'undefined') {
    return isDevelopment ? 'sandbox' : 'production';
  }
  return window.location.hostname.includes('dev.coze.site') ? 'sandbox' : 'production';
};
