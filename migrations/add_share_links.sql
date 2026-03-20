-- 创建分享链接表
CREATE TABLE IF NOT EXISTS pi_share_links (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) NOT NULL UNIQUE,
  application_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36),
  expires_at TIMESTAMP,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_share_links_token ON pi_share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_application_id ON pi_share_links(application_id);
CREATE INDEX IF NOT EXISTS idx_share_links_created_by ON pi_share_links(created_by);

-- 添加注释
COMMENT ON TABLE pi_share_links IS '分享链接表';
COMMENT ON COLUMN pi_share_links.id IS '主键ID';
COMMENT ON COLUMN pi_share_links.token IS '分享token';
COMMENT ON COLUMN pi_share_links.application_id IS '关联的申请ID';
COMMENT ON COLUMN pi_share_links.created_by IS '创建者用户ID';
COMMENT ON COLUMN pi_share_links.expires_at IS '过期时间';
COMMENT ON COLUMN pi_share_links.is_used IS '是否已使用';
COMMENT ON COLUMN pi_share_links.used_at IS '使用时间';
COMMENT ON COLUMN pi_share_links.created_at IS '创建时间';
