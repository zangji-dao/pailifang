import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { nanoid } from 'nanoid';

/**
 * POST /api/applications/share
 * 创建分享链接
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, createdBy } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: '缺少申请ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查申请是否存在
    const { data: application, error: appError } = await client
      .from('pi_settlement_applications')
      .select('id, application_no')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: '申请不存在' },
        { status: 404 }
      );
    }

    // 生成分享token (32位随机字符串)
    const token = nanoid(32);

    // 设置过期时间 (7天后)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 创建分享链接
    const { data: shareLink, error: shareError } = await client
      .from('pi_share_links')
      .insert({
        token,
        application_id: applicationId,
        created_by: createdBy || null,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })
      .select('id, token')
      .single();

    if (shareError) {
      console.error('创建分享链接失败:', shareError);
      return NextResponse.json(
        { success: false, error: '创建分享链接失败' },
        { status: 500 }
      );
    }

    // 生成完整的分享URL（环境变量已包含 https:// 前缀）
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token: shareLink.token,
        shareUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('创建分享链接异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
