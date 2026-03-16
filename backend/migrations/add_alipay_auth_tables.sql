-- 支付宝授权信息表
-- 用于存储用户的支付宝授权令牌，支持自动刷新

CREATE TABLE IF NOT EXISTS alipay_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                          -- 关联用户ID
  alipay_user_id VARCHAR(64),                     -- 支付宝用户ID
  
  -- 授权令牌
  access_token VARCHAR(512),                      -- 访问令牌（1天有效）
  refresh_token VARCHAR(512),                     -- 刷新令牌（30天有效）
  
  -- 过期时间
  expires_at TIMESTAMPTZ,                         -- access_token过期时间
  refresh_expires_at TIMESTAMPTZ,                 -- refresh_token过期时间
  
  -- 授权范围
  auth_scopes TEXT[],                             -- 授权范围列表
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',            -- active/expired/revoked
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：每个用户只有一条有效的授权记录
  CONSTRAINT uk_user_alipay_auth UNIQUE(user_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_alipay_auth_user_id ON alipay_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_alipay_auth_status ON alipay_auth_tokens(status);
CREATE INDEX IF NOT EXISTS idx_alipay_auth_expires ON alipay_auth_tokens(expires_at);

-- 注释
COMMENT ON TABLE alipay_auth_tokens IS '支付宝授权令牌表';
COMMENT ON COLUMN alipay_auth_tokens.user_id IS '系统用户ID';
COMMENT ON COLUMN alipay_auth_tokens.alipay_user_id IS '支付宝用户唯一标识';
COMMENT ON COLUMN alipay_auth_tokens.access_token IS '访问令牌，有效期1天';
COMMENT ON COLUMN alipay_auth_tokens.refresh_token IS '刷新令牌，有效期30天';
COMMENT ON COLUMN alipay_auth_tokens.expires_at IS 'access_token过期时间';
COMMENT ON COLUMN alipay_auth_tokens.refresh_expires_at IS 'refresh_token过期时间';
COMMENT ON COLUMN alipay_auth_tokens.status IS '授权状态：active-有效, expired-过期, revoked-已撤销';

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_alipay_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alipay_auth_updated_at
  BEFORE UPDATE ON alipay_auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_alipay_auth_updated_at();
