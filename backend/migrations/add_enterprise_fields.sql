-- 添加企业表缺失字段
-- 执行时间: 2026-03-19

-- 添加注册地址字段
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS registered_address VARCHAR(500);

-- 添加经营地址字段
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS business_address VARCHAR(500);

-- 添加入驻日期字段
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS settled_date TIMESTAMP;

-- 添加备注字段
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 添加索引
CREATE INDEX IF NOT EXISTS enterprises_status_idx ON enterprises(status);
