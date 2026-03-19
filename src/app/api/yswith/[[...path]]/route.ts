import { NextRequest, NextResponse } from 'next/server';

// 获取后端 API 基础地址
function getApiBaseUrl(): string {
  // 沙箱环境
  if (process.env.COZE_PROJECT_ENV === 'DEV' || 
      (process.env.COZE_PROJECT_DOMAIN_DEFAULT || '').includes('dev.coze.site')) {
    return 'http://localhost:4001';
  }
  // 生产环境
  return 'http://localhost:4001';
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();
  const path = request.nextUrl.pathname.replace('/api/yswith', '/api/yswith');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${apiBaseUrl}${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('萤石云 API 代理错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '请求失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();
  const path = request.nextUrl.pathname.replace('/api/yswith', '/api/yswith');
  const url = `${apiBaseUrl}${path}`;

  try {
    const body = await request.json();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('萤石云 API 代理错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '请求失败' },
      { status: 500 }
    );
  }
}
