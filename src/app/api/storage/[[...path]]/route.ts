import { NextRequest, NextResponse } from 'next/server';

/**
 * API 代理：/api/storage/* → 后端存储服务
 * 用于处理文件上传等存储相关请求
 */
async function proxyRequest(request: NextRequest, method: string) {
  try {
    const path = request.nextUrl.pathname.replace('/api/storage', '');
    const searchParams = request.nextUrl.searchParams.toString();
    
    const apiBaseUrl = 'http://localhost:4001';
    const url = `${apiBaseUrl}/api/storage${path}${searchParams ? `?${searchParams}` : ''}`;

    // 对于文件上传，需要直接转发 FormData
    const contentType = request.headers.get('Content-Type') || '';
    
    const headers: HeadersInit = {};
    
    // 如果是 multipart/form-data，不手动设置 Content-Type，让浏览器自动处理
    if (!contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType || 'application/json';
    }

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      // 对于文件上传，直接转发请求体
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        options.body = formData;
      } else {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }

    const response = await fetch(url, options);
    
    // 处理响应
    const responseContentType = response.headers.get('Content-Type') || '';
    
    if (responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // 对于非 JSON 响应，直接返回二进制数据
      const data = await response.arrayBuffer();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
        },
      });
    }
  } catch (error) {
    console.error('存储 API 代理错误:', error);
    return NextResponse.json(
      { success: false, error: '存储 API 代理请求失败' },
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
