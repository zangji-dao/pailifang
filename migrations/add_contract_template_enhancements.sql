-- 合同模板系统增强迁移
-- 支持文档上传、自动解析、可填充字段

-- 1. 为 contract_templates 表添加新字段
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS source_file_url TEXT,
ADD COLUMN IF NOT EXISTS source_file_name TEXT,
ADD COLUMN IF NOT EXISTS source_file_type VARCHAR(20), -- 'pdf' | 'docx' | 'doc'
ADD COLUMN IF NOT EXISTS parse_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'parsing' | 'completed' | 'failed'
ADD COLUMN IF NOT EXISTS parse_error TEXT,
ADD COLUMN IF NOT EXISTS field_definitions JSONB DEFAULT '[]'::jsonb;

-- 2. 创建可填充字段定义表
CREATE TABLE IF NOT EXISTS contract_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  field_key VARCHAR(100) NOT NULL,           -- 字段标识，如 "party_a_name"
  field_label VARCHAR(200) NOT NULL,         -- 显示名称，如 "甲方名称"
  field_type VARCHAR(20) NOT NULL DEFAULT 'text', -- text | date | number | select | textarea
  default_value TEXT,
  options JSONB,                             -- select类型选项
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  position_hint JSONB,                       -- 位置信息，用于高亮显示 {page: 1, x: 100, y: 200}
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, field_key)
);

-- 3. 创建合同实例表（填充后的合同）
CREATE TABLE IF NOT EXISTS contract_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  contract_number VARCHAR(50),               -- 合同编号
  field_values JSONB DEFAULT '{}'::jsonb,   -- 填充的字段值
  selected_attachments UUID[] DEFAULT '{}',  -- 选择的附件ID列表
  status VARCHAR(20) DEFAULT 'draft',        -- draft | pending | signed | archived
  pdf_url TEXT,                              -- 生成的PDF文件URL
  signed_pdf_url TEXT,                       -- 签名后的PDF URL
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 为 contract_attachments 表添加新字段
ALTER TABLE contract_attachments
ADD COLUMN IF NOT EXISTS source_file_url TEXT,
ADD COLUMN IF NOT EXISTS source_file_name TEXT,
ADD COLUMN IF NOT EXISTS page_range VARCHAR(50), -- 从原PDF提取的页码范围，如 "6-10"
ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT false; -- 是否自动检测

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_contract_fields_template ON contract_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_template ON contract_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_enterprise ON contract_instances(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_status ON contract_instances(status);

-- 6. 添加注释
COMMENT ON TABLE contract_fields IS '合同模板可填充字段定义';
COMMENT ON TABLE contract_instances IS '合同实例（填充字段后生成的具体合同）';

COMMENT ON COLUMN contract_templates.source_file_url IS '原始上传文件URL';
COMMENT ON COLUMN contract_templates.source_file_name IS '原始文件名';
COMMENT ON COLUMN contract_templates.parse_status IS '解析状态：pending/parsing/completed/failed';
COMMENT ON COLUMN contract_templates.field_definitions IS '字段定义（旧版兼容，新版使用contract_fields表）';

COMMENT ON COLUMN contract_fields.field_key IS '字段标识，用于填充时匹配';
COMMENT ON COLUMN contract_fields.field_type IS '字段类型：text/date/number/select/textarea';
COMMENT ON COLUMN contract_fields.position_hint IS '文档中的位置提示，用于可视化标注';

COMMENT ON COLUMN contract_instances.field_values IS '填充的字段值JSON';
COMMENT ON COLUMN contract_instances.selected_attachments IS '选择的附件ID数组';
