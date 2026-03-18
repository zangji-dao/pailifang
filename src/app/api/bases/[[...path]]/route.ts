import { NextRequest, NextResponse } from 'next/server';

/**
 * API 代理：/api/bases/* → 后端
 * 自动判断环境，无需手动配置
 */
async function proxyRequest(request: NextRequest, method: string) {
  try {
    const path = request.nextUrl.pathname.replace('/api/bases', '');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // 确定后端地址（与 apiClient.ts 逻辑一致）
    let apiBaseUrl: string;
    
    // 沙箱环境：使用生产后端
    if (process.env.COZE_PROJECT_DOMAIN_DEFAULT?.includes('dev.coze.site')) {
      apiBaseUrl = 'http://152.136.12.122:4001';
    } else {
      // 生产服务器：使用本地后端
      apiBaseUrl = 'http://localhost:4001';
    }
    
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
