import { NextRequest, NextResponse } from 'next/server';

/**
 * 注册代理接口
 * 将前端请求转发到后端服务 (localhost:4001)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:4001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('注册代理错误:', error);
    return NextResponse.json(
      { success: false, error: '注册服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}
