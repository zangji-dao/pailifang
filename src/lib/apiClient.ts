// API 基础配置
// 自动判断环境，无需手动配置

const getApiBaseUrl = (): string => {
  // 服务端渲染时
  if (typeof window === 'undefined') {
    // 沙箱环境：使用生产后端
    if (process.env.COZE_PROJECT_DOMAIN_DEFAULT?.includes('dev.coze.site')) {
      return 'http://152.136.12.122:4001';
    }
    // 生产服务器：使用本地后端
    return 'http://localhost:4001';
  }
  
  // 客户端
  const { protocol, hostname, port } = window.location;
  
  // 沙箱环境：使用生产后端
  if (hostname.includes('dev.coze.site')) {
    return 'http://152.136.12.122:4001';
  }
  
  // 生产环境：通过域名访问（无端口）→ 使用 Nginx 代理
  if (!port || port === '80' || port === '443') {
    return `${protocol}//${hostname}/api`;
  }
  
  // 生产环境：通过 IP:端口访问 → 使用同 IP 的 4001 端口
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

export const apiClient = new ApiClient(API_BASE_URL);
export const API_BASE_URL_EXPORTED = API_BASE_URL;
