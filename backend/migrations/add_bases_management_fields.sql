-- 为 bases 表添加管理公司字段和地址模板字段
-- 执行时间: 2024-03-26

-- 添加地址模板字段
ALTER TABLE bases ADD COLUMN IF NOT EXISTS address_template TEXT;

-- 添加管理公司信息字段
ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_name VARCHAR(255);
ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_credit_code VARCHAR(50);
ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_legal_person VARCHAR(100);
ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_address VARCHAR(500);
ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_phone VARCHAR(50);

-- 添加注释
COMMENT ON COLUMN bases.address_template IS '地址模板，用于生成工位号地址，包含（工位号）占位符';
COMMENT ON COLUMN bases.management_company_name IS '管理公司名称（甲方）';
COMMENT ON COLUMN bases.management_company_credit_code IS '管理公司统一社会信用代码';
COMMENT ON COLUMN bases.management_company_legal_person IS '管理公司法定代表人';
COMMENT ON COLUMN bases.management_company_address IS '管理公司地址';
COMMENT ON COLUMN bases.management_company_phone IS '管理公司联系电话';
