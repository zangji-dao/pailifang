// API 基础配置
// 动态获取 API 地址：优先使用环境变量，否则根据当前访问地址自动判断
const getApiBaseUrl = (): string => {
  // 1. 优先使用环境变量
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. 服务端渲染时
  if (typeof window === 'undefined') {
    // 检查是否是沙箱环境（通过环境变量判断）
    if (process.env.COZE_PROJECT_DOMAIN_DEFAULT?.includes('dev.coze.site')) {
      return 'http://152.136.12.122:4001';
    }
    return 'http://localhost:4001';
  }
  
  // 3. 客户端：根据当前访问地址动态判断
  const { protocol, hostname, port } = window.location;
  
  // 沙箱环境（*.dev.coze.site）使用生产环境后端
  if (hostname.includes('dev.coze.site')) {
    return 'http://152.136.12.122:4001';
  }
  
  // 如果通过域名访问（无端口或端口80/443），使用相对路径 /api（通过 Nginx 代理）
  if (!port || port === '80' || port === '443') {
    return `${protocol}//${hostname}/api`;
  }
  
  // 如果通过 IP:端口访问，使用同 IP 的 4001 端口
  return `${protocol}//${hostname}:4001`;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      // 静默处理网络错误，返回失败响应让调用方处理降级逻辑
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 导出 API 客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// 导出 API 基础 URL
export const API_BASE_URL_EXPORTED = API_BASE_URL;
