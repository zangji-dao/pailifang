-- =====================================================
-- 币种管理数据表创建脚本
-- 执行时间: 2025-01-17
-- 说明: 创建币种档案表，支持多币种核算
-- =====================================================

-- ==================== 币种档案表 ====================
CREATE TABLE IF NOT EXISTS currencies (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,                   -- 币种代码（如 CNY、USD、EUR）
  name VARCHAR(50) NOT NULL,                          -- 币种名称（如 人民币、美元、欧元）
  symbol VARCHAR(10),                                 -- 货币符号（如 ¥、$、€）
  exchange_rate DECIMAL(18, 6) NOT NULL DEFAULT 1,    -- 汇率（相对于本位币）
  is_base BOOLEAN NOT NULL DEFAULT FALSE,             -- 是否本位币
  decimal_places INTEGER NOT NULL DEFAULT 2,          -- 小数位数
  status VARCHAR(20) NOT NULL DEFAULT 'active',       -- 状态: active, inactive
  sort_order INTEGER DEFAULT 0,                       -- 排序
  remark TEXT,                                         -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS currency_code_idx ON currencies(code);
CREATE INDEX IF NOT EXISTS currency_status_idx ON currencies(status);

-- 插入常用币种数据
INSERT INTO currencies (code, name, symbol, exchange_rate, is_base, decimal_places, status, sort_order) VALUES
('CNY', '人民币', '¥', 1.000000, true, 2, 'active', 1),
('USD', '美元', '$', 7.250000, false, 2, 'active', 2),
('EUR', '欧元', '€', 7.850000, false, 2, 'active', 3),
('GBP', '英镑', '£', 9.150000, false, 2, 'active', 4),
('JPY', '日元', '¥', 0.048000, false, 0, 'active', 5),
('HKD', '港币', 'HK$', 0.930000, false, 2, 'active', 6),
('TWD', '新台币', 'NT$', 0.220000, false, 2, 'active', 7),
('KRW', '韩元', '₩', 0.005400, false, 0, 'active', 8),
('SGD', '新加坡元', 'S$', 5.350000, false, 2, 'active', 9),
('AUD', '澳大利亚元', 'A$', 4.720000, false, 2, 'active', 10),
('CAD', '加拿大元', 'C$', 5.280000, false, 2, 'active', 11),
('CHF', '瑞士法郎', 'Fr', 8.150000, false, 2, 'active', 12),
('THB', '泰国铢', '฿', 0.210000, false, 2, 'active', 13),
('MYR', '马来西亚林吉特', 'RM', 1.620000, false, 2, 'active', 14),
('RUB', '卢布', '₽', 0.078000, false, 2, 'active', 15);

-- ==================== 汇率历史表 ====================
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_id VARCHAR(36) NOT NULL,                   -- 币种ID
  currency_code VARCHAR(10) NOT NULL,                 -- 币种代码（冗余）
  rate_date DATE NOT NULL,                            -- 汇率日期
  exchange_rate DECIMAL(18, 6) NOT NULL,              -- 汇率
  source VARCHAR(50),                                 -- 汇率来源（如：中国银行、央行）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_erh_currency FOREIGN KEY (currency_id) 
    REFERENCES currencies(id) ON DELETE CASCADE,
  CONSTRAINT uq_currency_date UNIQUE (currency_id, rate_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS erh_currency_id_idx ON exchange_rate_history(currency_id);
CREATE INDEX IF NOT EXISTS erh_rate_date_idx ON exchange_rate_history(rate_date);

-- =====================================================
-- 执行完成
-- =====================================================
