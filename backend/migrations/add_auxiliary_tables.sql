-- =====================================================
-- 辅助核算相关数据表创建脚本
-- 执行时间: 2025-01-17
-- 说明: 创建辅助核算类型表、辅助核算档案表、科目辅助核算设置表等
-- =====================================================

-- ==================== 1. 辅助核算类型表 ====================
CREATE TABLE IF NOT EXISTS auxiliary_types (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,                          -- 类型名称
  code VARCHAR(20) NOT NULL,                          -- 类型编码
  description TEXT,                                    -- 描述
  is_system BOOLEAN NOT NULL DEFAULT FALSE,           -- 是否系统预设
  status VARCHAR(20) NOT NULL DEFAULT 'active',       -- 状态: active, inactive
  sort_order INTEGER DEFAULT 0,                       -- 排序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS at_code_idx ON auxiliary_types(code);
CREATE INDEX IF NOT EXISTS at_status_idx ON auxiliary_types(status);

-- 插入系统预设的辅助核算类型
INSERT INTO auxiliary_types (name, code, description, is_system, status, sort_order) VALUES
('客户', 'customer', '客户辅助核算', true, 'active', 1),
('供应商', 'supplier', '供应商辅助核算', true, 'active', 2),
('部门', 'department', '部门辅助核算', true, 'active', 3),
('职员', 'employee', '职员辅助核算', true, 'active', 4),
('项目', 'project', '项目辅助核算', true, 'active', 5),
('存货', 'inventory', '存货辅助核算', true, 'active', 6),
('固定资产', 'fixed_asset', '固定资产辅助核算', true, 'active', 7),
('往来单位', 'partner', '往来单位辅助核算（包含客户和供应商）', true, 'active', 8);

-- ==================== 2. 辅助核算档案表 ====================
CREATE TABLE IF NOT EXISTS auxiliary_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id VARCHAR(36) NOT NULL,                       -- 类型ID
  code VARCHAR(50) NOT NULL,                          -- 项目编码
  name VARCHAR(200) NOT NULL,                         -- 项目名称
  parent_id VARCHAR(36),                              -- 父级ID（支持多级）
  full_code VARCHAR(200),                             -- 完整编码（含上级）
  full_name VARCHAR(500),                             -- 完整名称（含上级）
  is_leaf BOOLEAN NOT NULL DEFAULT TRUE,              -- 是否叶子节点
  status VARCHAR(20) NOT NULL DEFAULT 'active',       -- 状态
  remark TEXT,                                         -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_auxiliary_item_type FOREIGN KEY (type_id) 
    REFERENCES auxiliary_types(id) ON DELETE CASCADE,
  CONSTRAINT fk_auxiliary_item_parent FOREIGN KEY (parent_id) 
    REFERENCES auxiliary_items(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS ai_type_id_idx ON auxiliary_items(type_id);
CREATE INDEX IF NOT EXISTS ai_code_idx ON auxiliary_items(code);
CREATE INDEX IF NOT EXISTS ai_parent_id_idx ON auxiliary_items(parent_id);
CREATE INDEX IF NOT EXISTS ai_status_idx ON auxiliary_items(status);
CREATE INDEX IF NOT EXISTS ai_full_code_idx ON auxiliary_items(full_code);

-- 插入示例数据
-- 部门数据
INSERT INTO auxiliary_items (type_id, code, name, full_code, full_name, is_leaf) 
SELECT id, '01', '总经办', '01', '总经办', true FROM auxiliary_types WHERE code = 'department';

INSERT INTO auxiliary_items (type_id, code, name, full_code, full_name, is_leaf) 
SELECT id, '02', '财务部', '02', '财务部', true FROM auxiliary_types WHERE code = 'department';

INSERT INTO auxiliary_items (type_id, code, name, full_code, full_name, is_leaf) 
SELECT id, '03', '销售部', '03', '销售部', true FROM auxiliary_types WHERE code = 'department';

INSERT INTO auxiliary_items (type_id, code, name, full_code, full_name, is_leaf) 
SELECT id, '04', '行政部', '04', '行政部', true FROM auxiliary_types WHERE code = 'department';

-- ==================== 3. 科目辅助核算设置表 ====================
CREATE TABLE IF NOT EXISTS account_auxiliary_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(36) NOT NULL,                    -- 科目ID
  auxiliary_type_id VARCHAR(36) NOT NULL,             -- 辅助核算类型ID
  is_required BOOLEAN NOT NULL DEFAULT FALSE,         -- 是否必填
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_aas_account FOREIGN KEY (account_id) 
    REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_aas_auxiliary_type FOREIGN KEY (auxiliary_type_id) 
    REFERENCES auxiliary_types(id) ON DELETE CASCADE,
  CONSTRAINT uq_account_auxiliary UNIQUE (account_id, auxiliary_type_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS aas_account_id_idx ON account_auxiliary_settings(account_id);
CREATE INDEX IF NOT EXISTS aas_auxiliary_type_id_idx ON account_auxiliary_settings(auxiliary_type_id);

-- ==================== 4. 凭证分录表添加辅助核算字段 ====================
ALTER TABLE voucher_entries 
ADD COLUMN IF NOT EXISTS quantity DECIMAL(18, 4),           -- 数量
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(18, 4),         -- 单价
ADD COLUMN IF NOT EXISTS unit VARCHAR(20),                  -- 单位
ADD COLUMN IF NOT EXISTS currency VARCHAR(10),              -- 币种
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(18, 2),    -- 原币金额
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(18, 6);      -- 汇率

-- ==================== 5. 凭证分录辅助核算明细表 ====================
CREATE TABLE IF NOT EXISTS voucher_entry_auxiliaries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id VARCHAR(36) NOT NULL,                      -- 凭证分录ID
  auxiliary_type_id VARCHAR(36) NOT NULL,             -- 辅助核算类型ID
  auxiliary_type_name VARCHAR(50) NOT NULL,           -- 类型名称（冗余）
  auxiliary_item_id VARCHAR(36) NOT NULL,             -- 辅助核算项目ID
  auxiliary_item_code VARCHAR(50) NOT NULL,           -- 项目编码（冗余）
  auxiliary_item_name VARCHAR(200) NOT NULL,          -- 项目名称（冗余）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_vea_entry FOREIGN KEY (entry_id) 
    REFERENCES voucher_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_vea_auxiliary_type FOREIGN KEY (auxiliary_type_id) 
    REFERENCES auxiliary_types(id) ON DELETE CASCADE,
  CONSTRAINT fk_vea_auxiliary_item FOREIGN KEY (auxiliary_item_id) 
    REFERENCES auxiliary_items(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS vea_entry_id_idx ON voucher_entry_auxiliaries(entry_id);
CREATE INDEX IF NOT EXISTS vea_auxiliary_type_id_idx ON voucher_entry_auxiliaries(auxiliary_type_id);
CREATE INDEX IF NOT EXISTS vea_auxiliary_item_id_idx ON voucher_entry_auxiliaries(auxiliary_item_id);

-- ==================== 6. 辅助核算余额表 ====================
CREATE TABLE IF NOT EXISTS auxiliary_balances (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id VARCHAR(36) NOT NULL,                     -- 账套ID
  account_id VARCHAR(36) NOT NULL,                    -- 科目ID
  account_code VARCHAR(20) NOT NULL,                  -- 科目编码
  auxiliary_type_id VARCHAR(36) NOT NULL,             -- 辅助核算类型ID
  auxiliary_item_id VARCHAR(36) NOT NULL,             -- 辅助核算项目ID
  auxiliary_item_code VARCHAR(50) NOT NULL,           -- 项目编码
  auxiliary_item_name VARCHAR(200) NOT NULL,          -- 项目名称
  period VARCHAR(20) NOT NULL,                        -- 会计期间
  beginning_debit DECIMAL(18, 2) NOT NULL DEFAULT 0,  -- 期初借方余额
  beginning_credit DECIMAL(18, 2) NOT NULL DEFAULT 0, -- 期初贷方余额
  current_debit DECIMAL(18, 2) NOT NULL DEFAULT 0,    -- 本期借方发生额
  current_credit DECIMAL(18, 2) NOT NULL DEFAULT 0,   -- 本期贷方发生额
  ending_debit DECIMAL(18, 2) NOT NULL DEFAULT 0,     -- 期末借方余额
  ending_credit DECIMAL(18, 2) NOT NULL DEFAULT 0,    -- 期末贷方余额
  direction VARCHAR(10) NOT NULL,                     -- 余额方向
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_ab_ledger FOREIGN KEY (ledger_id) 
    REFERENCES ledgers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ab_account FOREIGN KEY (account_id) 
    REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ab_auxiliary_type FOREIGN KEY (auxiliary_type_id) 
    REFERENCES auxiliary_types(id) ON DELETE CASCADE,
  CONSTRAINT fk_ab_auxiliary_item FOREIGN KEY (auxiliary_item_id) 
    REFERENCES auxiliary_items(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS ab_ledger_id_idx ON auxiliary_balances(ledger_id);
CREATE INDEX IF NOT EXISTS ab_account_id_idx ON auxiliary_balances(account_id);
CREATE INDEX IF NOT EXISTS ab_auxiliary_type_id_idx ON auxiliary_balances(auxiliary_type_id);
CREATE INDEX IF NOT EXISTS ab_auxiliary_item_id_idx ON auxiliary_balances(auxiliary_item_id);
CREATE INDEX IF NOT EXISTS ab_period_idx ON auxiliary_balances(period);
CREATE INDEX IF NOT EXISTS ab_unique_idx ON auxiliary_balances(ledger_id, account_id, auxiliary_type_id, auxiliary_item_id, period);

-- =====================================================
-- 执行完成
-- =====================================================
