import { NextRequest, NextResponse } from 'next/server';

/**
 * API 代理：/api/bases/* → 后端
 * 自动判断环境，无需手动配置
 * 
 * 环境逻辑：
 * - 沙箱环境：代理到 localhost:4001（沙箱独立后端）
 * - 生产环境：代理到 localhost:4001（本地后端）
 */
async function proxyRequest(request: NextRequest, method: string) {
  try {
    const path = request.nextUrl.pathname.replace('/api/bases', '');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // 沙箱和生产环境都使用本地后端
    // 沙箱环境会启动独立的后端服务
    const apiBaseUrl = 'http://localhost:4001';
    
    const url = `${apiBaseUrl}/api/bases${path}${searchParams ? `?${searchParams}` : ''}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API 代理错误:', error);
    return NextResponse.json(
      { success: false, error: 'API 代理请求失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}
