import { NextResponse } from 'next/server';
import config from '@/config';

export async function GET() {
  try {
    const response = await fetch(`${config.backend.baseUrl}/api/alipay/configuration`, {
      cache: 'no-store',
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '支付宝配置状态查询失败',
      },
      { status: 503 }
    );
  }
}
