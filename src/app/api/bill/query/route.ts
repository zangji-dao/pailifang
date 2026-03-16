import { NextRequest, NextResponse } from 'next/server';
import { queryBillWithAuth, isAlipayConfigured, BillType, ChargeInstCodes } from '@/lib/alipay';
import { getValidAccessToken } from '@/lib/alipay-auth-service';

// 缴费类型映射
const billTypeMap: Record<string, BillType> = {
  electricity: BillType.ELECTRICITY,
  water: BillType.WATER,
  gas: BillType.GAS,
};

// 缴费机构映射（根据地区和类型）
const chargeInstMap: Record<string, Record<string, string>> = {
  // 吉林省松原市
  songyuan: {
    electricity: ChargeInstCodes.JILIN_ELECTRICITY,
    water: ChargeInstCodes.SONGYUAN_WATER,
  },
  // 可以添加更多地区的配置
};

export async function POST(request: NextRequest) {
  try {
    // 检查支付宝是否配置
    if (!isAlipayConfigured()) {
      return NextResponse.json({
        success: false,
        error: '支付宝未配置，请先配置环境变量 ALIPAY_APPID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY',
      }, { status: 500 });
    }

    const body = await request.json();
    const { billKey, billType, region = 'songyuan', userId = 'default-user-id' } = body;

    if (!billKey || !billType) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：billKey 或 billType',
      }, { status: 400 });
    }

    // 获取缴费类型
    const type = billTypeMap[billType.toLowerCase()];
    if (!type) {
      return NextResponse.json({
        success: false,
        error: `不支持的缴费类型: ${billType}，支持的类型: electricity, water, gas`,
      }, { status: 400 });
    }

    // 获取缴费机构编码
    const regionInsts = chargeInstMap[region.toLowerCase()];
    if (!regionInsts) {
      return NextResponse.json({
        success: false,
        error: `不支持的地区: ${region}，当前支持: songyuan`,
      }, { status: 400 });
    }

    const chargeInst = regionInsts[billType.toLowerCase()];
    if (!chargeInst) {
      return NextResponse.json({
        success: false,
        error: `该地区不支持 ${billType} 缴费查询`,
      }, { status: 400 });
    }

    // 获取用户的授权令牌
    const tokenResult = await getValidAccessToken(userId);

    if (!tokenResult.success) {
      return NextResponse.json({
        success: false,
        error: tokenResult.error,
        needAuth: tokenResult.needAuth,
      }, { status: tokenResult.needAuth ? 401 : 500 });
    }

    // 使用授权令牌查询账单
    const result = await queryBillWithAuth({
      billKey,
      chargeInst,
      billType: type,
      authToken: tokenResult.accessToken!,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('查询账单API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误',
    }, { status: 500 });
  }
}

// 获取支付宝配置状态
export async function GET() {
  return NextResponse.json({
    configured: isAlipayConfigured(),
    supportedRegions: Object.keys(chargeInstMap),
    supportedTypes: Object.keys(billTypeMap),
  });
}
