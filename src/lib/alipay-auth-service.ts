import { getSupabaseClient } from '@/storage/database/supabase-client';
import { refreshAccessToken } from './alipay';

/**
 * 授权令牌状态
 */
export interface AuthTokenStatus {
  hasAuth: boolean;
  status: 'active' | 'expired' | 'needs_refresh' | 'revoked';
  expiresAt?: Date;
  refreshExpiresAt?: Date;
  alipayUserId?: string;
}

/**
 * 获取用户的有效访问令牌
 * 自动处理令牌刷新
 */
export async function getValidAccessToken(userId: string): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
  needAuth?: boolean;
}> {
  const supabase = getSupabaseClient();

  // 查询用户的授权信息
  const { data: authData, error: dbError } = await supabase
    .from('alipay_auth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (dbError || !authData) {
    return {
      success: false,
      error: '未找到支付宝授权信息',
      needAuth: true,
    };
  }

  // 检查授权状态
  if (authData.status === 'revoked') {
    return {
      success: false,
      error: '支付宝授权已撤销，请重新授权',
      needAuth: true,
    };
  }

  const now = new Date();
  const expiresAt = new Date(authData.expires_at);
  const refreshExpiresAt = new Date(authData.refresh_expires_at);

  // 检查 refresh_token 是否过期
  if (now >= refreshExpiresAt) {
    // 标记为过期
    await supabase
      .from('alipay_auth_tokens')
      .update({ status: 'expired' })
      .eq('id', authData.id);

    return {
      success: false,
      error: '授权已过期，请重新授权',
      needAuth: true,
    };
  }

  // 检查 access_token 是否过期
  if (now >= expiresAt) {
    // 需要刷新 token
    console.log('Access token 已过期，正在刷新...');

    const refreshResult = await refreshAccessToken(authData.refresh_token);

    if (!refreshResult.success || !refreshResult.data) {
      return {
        success: false,
        error: refreshResult.error || '刷新令牌失败',
        needAuth: false,
      };
    }

    // 更新数据库中的令牌
    const { error: updateError } = await supabase
      .from('alipay_auth_tokens')
      .update({
        access_token: refreshResult.data.accessToken,
        refresh_token: refreshResult.data.refreshToken,
        expires_at: refreshResult.data.expiresAt.toISOString(),
        refresh_expires_at: refreshResult.data.refreshExpiresAt.toISOString(),
        status: 'active',
      })
      .eq('id', authData.id);

    if (updateError) {
      console.error('更新令牌失败:', updateError);
      return {
        success: false,
        error: '更新令牌失败',
        needAuth: false,
      };
    }

    return {
      success: true,
      accessToken: refreshResult.data.accessToken,
    };
  }

  // access_token 仍然有效
  return {
    success: true,
    accessToken: authData.access_token,
  };
}

/**
 * 获取用户的授权状态
 */
export async function getAuthStatus(userId: string): Promise<AuthTokenStatus> {
  const supabase = getSupabaseClient();

  const { data: authData, error } = await supabase
    .from('alipay_auth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !authData) {
    return {
      hasAuth: false,
      status: 'revoked',
    };
  }

  const now = new Date();
  const expiresAt = new Date(authData.expires_at);
  const refreshExpiresAt = new Date(authData.refresh_expires_at);

  let status: AuthTokenStatus['status'] = 'active';

  if (authData.status === 'revoked') {
    status = 'revoked';
  } else if (now >= refreshExpiresAt) {
    status = 'expired';
  } else if (now >= expiresAt) {
    status = 'needs_refresh';
  }

  return {
    hasAuth: true,
    status,
    expiresAt,
    refreshExpiresAt,
    alipayUserId: authData.alipay_user_id,
  };
}

/**
 * 撤销用户的支付宝授权
 */
export async function revokeAuth(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('alipay_auth_tokens')
    .update({ status: 'revoked' })
    .eq('user_id', userId);

  if (error) {
    return {
      success: false,
      error: '撤销授权失败',
    };
  }

  return {
    success: true,
  };
}
