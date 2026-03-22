-- 添加企业表新字段
-- 支持新流程：选择基地→选择类型→选择工位号→上传产权证明→提取企业名称

-- 1. 添加基地ID字段
ALTER TABLE enterprises 
ADD COLUMN IF NOT EXISTS base_id UUID REFERENCES bases(id);

-- 2. 添加产权证明文件URL
ALTER TABLE enterprises 
ADD COLUMN IF NOT EXISTS proof_document_url TEXT;

-- 3. 添加工位号ID字段（直接关联）
ALTER TABLE enterprises 
ADD COLUMN IF NOT EXISTS registration_number_id UUID REFERENCES registration_numbers(id);

-- 4. 添加工位号字段（冗余存储，便于显示）
ALTER TABLE enterprises 
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

-- 添加注释
COMMENT ON COLUMN enterprises.base_id IS '所属基地ID';
COMMENT ON COLUMN enterprises.proof_document_url IS '产权证明文件URL';
COMMENT ON COLUMN enterprises.registration_number_id IS '关联的工位号ID';
COMMENT ON COLUMN enterprises.registration_number IS '工位号';

-- 添加工位号表字段（如果不存在）
ALTER TABLE registration_numbers 
ADD COLUMN IF NOT EXISTS manual_code VARCHAR(50);

ALTER TABLE registration_numbers 
ADD COLUMN IF NOT EXISTS assigned_enterprise_name VARCHAR(255);

ALTER TABLE registration_numbers 
ADD COLUMN IF NOT EXISTS property_owner VARCHAR(255) DEFAULT '吉林省恒松物业管理有限公司';

ALTER TABLE registration_numbers 
ADD COLUMN IF NOT EXISTS management_company VARCHAR(255) DEFAULT '吉林省天之企业管理咨询有限公司';

-- 添加注释
COMMENT ON COLUMN registration_numbers.manual_code IS '人工编号（优先显示）';
COMMENT ON COLUMN registration_numbers.assigned_enterprise_name IS '预分配企业名称';
COMMENT ON COLUMN registration_numbers.property_owner IS '产权单位';
COMMENT ON COLUMN registration_numbers.management_company IS '管理单位';

-- 添加流程状态（如果不存在）
-- 入驻企业状态：pending_address, pending_registration, pending_contract, pending_payment, active, moved_out
-- 非入驻企业状态：negotiating, serving, terminated, pending_change

-- 更新已有数据的状态
UPDATE enterprises 
SET process_status = 'pending_registration' 
WHERE type = 'tenant' 
  AND process_status = 'new' 
  AND registered_address IS NOT NULL;

UPDATE enterprises 
SET process_status = 'pending_change' 
WHERE type = 'non_tenant' 
  AND process_status = 'new';
