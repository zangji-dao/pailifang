import { NextRequest, NextResponse } from 'next/server';

/**
 * API 代理：将 /api/bases/* 请求转发到后端
 * 沙箱环境：转发到生产环境后端
 * 生产环境：通过环境变量配置或 localhost:4001
 */
async function proxyRequest(request: NextRequest, method: string) {
  try {
    const path = request.nextUrl.pathname.replace('/api/bases', '');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // 确定 API 基础 URL
    let apiBaseUrl: string;
    
    // 1. 优先使用环境变量
    if (process.env.NEXT_PUBLIC_API_URL) {
      apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    }
    // 2. 沙箱环境（*.dev.coze.site）使用生产环境后端
    else if (request.nextUrl.hostname.includes('dev.coze.site')) {
      apiBaseUrl = 'http://152.136.12.122:4001';
    }
    // 3. 默认使用 localhost
    else {
      apiBaseUrl = 'http://localhost:4001';
    }
    
    const url = `${apiBaseUrl}/api/bases${path}${searchParams ? `?${searchParams}` : ''}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 转发 Authorization 头
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    // 转发请求体
    if (method !== 'GET' && method !== 'DELETE') {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    console.log(`[API代理] ${method} ${url}`);
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
