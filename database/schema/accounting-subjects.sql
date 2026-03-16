-- =============================================
-- 财务会计科目体系数据库设计
-- =============================================

-- 1. 会计准则表
CREATE TABLE accounting_standards (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 初始化会计准则数据
INSERT INTO accounting_standards (id, name, code, description) VALUES
('small_enterprise', '小企业会计准则', 'XQY', '适用于符合条件的小型企业'),
('enterprise', '企业会计准则', 'QY', '适用于大中型企业及上市公司'),
('non_profit_2026', '民间非营利组织会计制度', 'MFN', '2026版，适用于社会团体、基金会等'),
('farmer_coop_2023', '农民专业合作社财务制度', 'NMHZ', '2023版，适用于农民专业合作社'),
('union', '工会会计制度', 'GH', '适用于各级工会组织'),
('rural_collective', '农村集体经济组织核算制度', 'NCJT', '适用于农村集体经济组织');

-- 2. 会计科目类别表
CREATE TABLE subject_categories (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(10) NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO subject_categories (id, name, code, sort_order) VALUES
('assets', '资产类', 'A', 1),
('liabilities', '负债类', 'L', 2),
('equity', '所有者权益类', 'E', 3),
('cost', '成本类', 'C', 4),
('profit_loss', '损益类', 'P', 5);

-- 3. 会计科目主表
CREATE TABLE accounting_subjects (
  id VARCHAR(50) PRIMARY KEY,
  standard_id VARCHAR(50) NOT NULL REFERENCES accounting_standards(id),
  category_id VARCHAR(20) NOT NULL REFERENCES subject_categories(id),
  code VARCHAR(20) NOT NULL,           -- 科目编码
  name VARCHAR(100) NOT NULL,           -- 科目名称
  full_name VARCHAR(200),               -- 全称（包含上级）
  parent_code VARCHAR(20),              -- 上级科目编码
  level INT NOT NULL DEFAULT 1,         -- 科目级别（1-5级）
  is_leaf BOOLEAN DEFAULT false,        -- 是否末级科目
  is_enabled BOOLEAN DEFAULT true,      -- 是否启用
  balance_direction VARCHAR(10) NOT NULL, -- 余额方向：debit/credit
  has_auxiliary BOOLEAN DEFAULT false,  -- 是否有辅助核算
  auxiliary_types JSONB,                -- 辅助核算类型 ['customer','supplier','project','department']
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(standard_id, code)
);

-- 创建索引
CREATE INDEX idx_subjects_standard ON accounting_subjects(standard_id);
CREATE INDEX idx_subjects_category ON accounting_subjects(category_id);
CREATE INDEX idx_subjects_parent ON accounting_subjects(parent_code);

-- 4. 报表模板表
CREATE TABLE report_templates (
  id VARCHAR(50) PRIMARY KEY,
  standard_id VARCHAR(50) NOT NULL REFERENCES accounting_standards(id),
  report_type VARCHAR(50) NOT NULL,     -- balance_sheet/income_statement/cash_flow
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  is_standard BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(standard_id, code)
);

INSERT INTO report_templates (id, standard_id, report_type, name, code) VALUES
-- 小企业会计准则报表
('small_balance', 'small_enterprise', 'balance_sheet', '资产负债表', 'ZCFZB'),
('small_income', 'small_enterprise', 'income_statement', '利润表', 'LRB'),
('small_cashflow', 'small_enterprise', 'cash_flow', '现金流量表', 'XJLLB'),

-- 企业会计准则报表
('ent_balance', 'enterprise', 'balance_sheet', '资产负债表', 'ZCFZB'),
('ent_income', 'enterprise', 'income_statement', '利润表', 'LRB'),
('ent_cashflow', 'enterprise', 'cash_flow', '现金流量表', 'XJLLB'),
('ent_equity', 'enterprise', 'equity_change', '所有者权益变动表', 'SYZQYBDB'),

-- 民间非营利组织报表
('nonprofit_balance', 'non_profit_2026', 'balance_sheet', '资产负债表', 'ZCFZB'),
('nonprofit_income', 'non_profit_2026', 'income_statement', '业务活动表', 'YWHDB');

-- 5. 报表项目表
CREATE TABLE report_items (
  id VARCHAR(50) PRIMARY KEY,
  template_id VARCHAR(50) NOT NULL REFERENCES report_templates(id),
  row_code VARCHAR(20) NOT NULL,        -- 行次
  item_code VARCHAR(20) NOT NULL,       -- 项目编码
  item_name VARCHAR(100) NOT NULL,      -- 项目名称
  parent_code VARCHAR(20),              -- 上级项目编码
  level INT DEFAULT 1,
  is_subtotal BOOLEAN DEFAULT false,    -- 是否小计行
  is_total BOOLEAN DEFAULT false,       -- 是否合计行
  formula TEXT,                         -- 计算公式（JSON格式）
  subject_codes JSONB,                  -- 对应科目编码列表
  row_order INT DEFAULT 0,
  
  UNIQUE(template_id, item_code)
);

-- 6. 增值税科目配置表
CREATE TABLE vat_subject_config (
  id VARCHAR(50) PRIMARY KEY,
  taxpayer_type VARCHAR(20) NOT NULL,   -- general/small
  subject_code VARCHAR(20) NOT NULL,    -- 科目编码
  subject_name VARCHAR(100) NOT NULL,   -- 科目名称
  parent_code VARCHAR(20),              -- 上级科目
  is_required BOOLEAN DEFAULT true,     -- 是否必须
  is_multi_column BOOLEAN DEFAULT false, -- 是否多栏账
  column_name VARCHAR(50),              -- 多栏列名
  sort_order INT DEFAULT 0
);

-- 一般纳税人增值税科目配置
INSERT INTO vat_subject_config (id, taxpayer_type, subject_code, subject_name, parent_code, is_required, is_multi_column, column_name, sort_order) VALUES
('vat_gen_1', 'general', '2221', '应交税费', NULL, true, false, NULL, 1),
('vat_gen_2', 'general', '222101', '应交增值税', '2221', true, true, NULL, 2),
('vat_gen_3', 'general', '22210101', '进项税额', '222101', true, true, '进项税额', 3),
('vat_gen_4', 'general', '22210102', '销项税额抵减', '222101', false, true, '销项税额抵减', 4),
('vat_gen_5', 'general', '22210103', '已交税金', '222101', true, true, '已交税金', 5),
('vat_gen_6', 'general', '22210104', '转出未交增值税', '222101', true, true, '转出未交增值税', 6),
('vat_gen_7', 'general', '22210105', '减免税款', '222101', false, true, '减免税款', 7),
('vat_gen_8', 'general', '22210106', '销项税额', '222101', true, true, '销项税额', 8),
('vat_gen_9', 'general', '22210107', '出口退税', '222101', false, true, '出口退税', 9),
('vat_gen_10', 'general', '22210108', '进项税额转出', '222101', true, true, '进项税额转出', 10),
('vat_gen_11', 'general', '22210109', '转出多交增值税', '222101', true, true, '转出多交增值税', 11),
('vat_gen_12', 'general', '22210110', '未交增值税', '222101', true, false, NULL, 12),
('vat_gen_13', 'general', '22210111', '预交增值税', '222101', false, false, NULL, 13),
('vat_gen_14', 'general', '22210112', '待抵扣进项税额', '222101', false, false, NULL, 14),
('vat_gen_15', 'general', '22210113', '待认证进项税额', '222101', false, false, NULL, 15);

-- 小规模纳税人增值税科目配置
INSERT INTO vat_subject_config (id, taxpayer_type, subject_code, subject_name, parent_code, is_required, is_multi_column, sort_order) VALUES
('vat_small_1', 'small', '2221', '应交税费', NULL, true, false, 1),
('vat_small_2', 'small', '222101', '应交增值税', '2221', true, false, 2);

-- =============================================
-- 小企业会计准则科目数据
-- =============================================

-- 资产类科目
INSERT INTO accounting_subjects (id, standard_id, category_id, code, name, full_name, parent_code, level, is_leaf, balance_direction, has_auxiliary, sort_order) VALUES
-- 一级科目
('small_1001', 'small_enterprise', 'assets', '1001', '库存现金', '库存现金', NULL, 1, true, 'debit', false, 1001),
('small_1002', 'small_enterprise', 'assets', '1002', '银行存款', '银行存款', NULL, 1, false, 'debit', false, 1002),
('small_1012', 'small_enterprise', 'assets', '1012', '其他货币资金', '其他货币资金', NULL, 1, false, 'debit', false, 1012),
('small_1101', 'small_enterprise', 'assets', '1101', '短期投资', '短期投资', NULL, 1, false, 'debit', false, 1101),
('small_1121', 'small_enterprise', 'assets', '1121', '应收票据', '应收票据', NULL, 1, true, 'debit', true, 1121),
('small_1122', 'small_enterprise', 'assets', '1122', '应收账款', '应收账款', NULL, 1, true, 'debit', true, 1122),
('small_1123', 'small_enterprise', 'assets', '1123', '预付账款', '预付账款', NULL, 1, true, 'debit', true, 1123),
('small_1131', 'small_enterprise', 'assets', '1131', '应收股利', '应收股利', NULL, 1, true, 'debit', false, 1131),
('small_1132', 'small_enterprise', 'assets', '1132', '应收利息', '应收利息', NULL, 1, true, 'debit', false, 1132),
('small_1221', 'small_enterprise', 'assets', '1221', '其他应收款', '其他应收款', NULL, 1, true, 'debit', true, 1221),
('small_1401', 'small_enterprise', 'assets', '1401', '材料采购', '材料采购', NULL, 1, true, 'debit', false, 1401),
('small_1402', 'small_enterprise', 'assets', '1402', '在途物资', '在途物资', NULL, 1, true, 'debit', false, 1402),
('small_1403', 'small_enterprise', 'assets', '1403', '原材料', '原材料', NULL, 1, true, 'debit', false, 1403),
('small_1404', 'small_enterprise', 'assets', '1404', '材料成本差异', '材料成本差异', NULL, 1, true, 'debit', false, 1404),
('small_1405', 'small_enterprise', 'assets', '1405', '库存商品', '库存商品', NULL, 1, true, 'debit', false, 1405),
('small_1407', 'small_enterprise', 'assets', '1407', '商品进销差价', '商品进销差价', NULL, 1, true, 'debit', false, 1407),
('small_1408', 'small_enterprise', 'assets', '1408', '委托加工物资', '委托加工物资', NULL, 1, true, 'debit', false, 1408),
('small_1411', 'small_enterprise', 'assets', '1411', '周转材料', '周转材料', NULL, 1, true, 'debit', false, 1411),
('small_1421', 'small_enterprise', 'assets', '1421', '消耗性生物资产', '消耗性生物资产', NULL, 1, true, 'debit', false, 1421),
('small_1501', 'small_enterprise', 'assets', '1501', '长期债券投资', '长期债券投资', NULL, 1, false, 'debit', false, 1501),
('small_1511', 'small_enterprise', 'assets', '1511', '长期股权投资', '长期股权投资', NULL, 1, false, 'debit', false, 1511),
('small_1601', 'small_enterprise', 'assets', '1601', '固定资产', '固定资产', NULL, 1, false, 'debit', false, 1601),
('small_1602', 'small_enterprise', 'assets', '1602', '累计折旧', '累计折旧', '1601', 1, true, 'credit', false, 1602),
('small_1604', 'small_enterprise', 'assets', '1604', '在建工程', '在建工程', NULL, 1, false, 'debit', false, 1604),
('small_1605', 'small_enterprise', 'assets', '1605', '工程物资', '工程物资', NULL, 1, true, 'debit', false, 1605),
('small_1606', 'small_enterprise', 'assets', '1606', '固定资产清理', '固定资产清理', NULL, 1, true, 'debit', false, 1606),
('small_1621', 'small_enterprise', 'assets', '1621', '生产性生物资产', '生产性生物资产', NULL, 1, false, 'debit', false, 1621),
('small_1622', 'small_enterprise', 'assets', '1622', '生产性生物资产累计折旧', '生产性生物资产累计折旧', '1621', 1, true, 'credit', false, 1622),
('small_1701', 'small_enterprise', 'assets', '1701', '无形资产', '无形资产', NULL, 1, false, 'debit', false, 1701),
('small_1702', 'small_enterprise', 'assets', '1702', '累计摊销', '累计摊销', '1701', 1, true, 'credit', false, 1702),
('small_1801', 'small_enterprise', 'assets', '1801', '长期待摊费用', '长期待摊费用', NULL, 1, true, 'debit', false, 1801),
('small_1811', 'small_enterprise', 'assets', '1811', '待处理财产损溢', '待处理财产损溢', NULL, 1, true, 'debit', false, 1811),

-- 负债类科目
('small_2001', 'small_enterprise', 'liabilities', '2001', '短期借款', '短期借款', NULL, 1, true, 'credit', false, 2001),
('small_2201', 'small_enterprise', 'liabilities', '2201', '应付票据', '应付票据', NULL, 1, true, 'credit', true, 2201),
('small_2202', 'small_enterprise', 'liabilities', '2202', '应付账款', '应付账款', NULL, 1, true, 'credit', true, 2202),
('small_2203', 'small_enterprise', 'liabilities', '2203', '预收账款', '预收账款', NULL, 1, true, 'credit', true, 2203),
('small_2211', 'small_enterprise', 'liabilities', '2211', '应付职工薪酬', '应付职工薪酬', NULL, 1, false, 'credit', false, 2211),
('small_2221', 'small_enterprise', 'liabilities', '2221', '应交税费', '应交税费', NULL, 1, false, 'credit', false, 2221),
('small_2231', 'small_enterprise', 'liabilities', '2231', '应付利息', '应付利息', NULL, 1, true, 'credit', false, 2231),
('small_2232', 'small_enterprise', 'liabilities', '2232', '应付利润', '应付利润', NULL, 1, true, 'credit', false, 2232),
('small_2241', 'small_enterprise', 'liabilities', '2241', '其他应付款', '其他应付款', NULL, 1, true, 'credit', true, 2241),
('small_2401', 'small_enterprise', 'liabilities', '2401', '递延收益', '递延收益', NULL, 1, true, 'credit', false, 2401),
('small_2501', 'small_enterprise', 'liabilities', '2501', '长期借款', '长期借款', NULL, 1, false, 'credit', false, 2501),
('small_2701', 'small_enterprise', 'liabilities', '2701', '长期应付款', '长期应付款', NULL, 1, true, 'credit', false, 2701),

-- 所有者权益类科目
('small_3001', 'small_enterprise', 'equity', '3001', '实收资本', '实收资本', NULL, 1, true, 'credit', true, 3001),
('small_3002', 'small_enterprise', 'equity', '3002', '资本公积', '资本公积', NULL, 1, false, 'credit', false, 3002),
('small_3101', 'small_enterprise', 'equity', '3101', '盈余公积', '盈余公积', NULL, 1, false, 'credit', false, 3101),
('small_3103', 'small_enterprise', 'equity', '3103', '本年利润', '本年利润', NULL, 1, true, 'credit', false, 3103),
('small_3104', 'small_enterprise', 'equity', '3104', '利润分配', '利润分配', NULL, 1, false, 'credit', false, 3104),

-- 成本类科目
('small_4001', 'small_enterprise', 'cost', '4001', '生产成本', '生产成本', NULL, 1, false, 'debit', false, 4001),
('small_4101', 'small_enterprise', 'cost', '4101', '制造费用', '制造费用', NULL, 1, true, 'debit', false, 4101),
('small_4301', 'small_enterprise', 'cost', '4301', '研发支出', '研发支出', NULL, 1, false, 'debit', false, 4301),
('small_4401', 'small_enterprise', 'cost', '4401', '工程施工', '工程施工', NULL, 1, false, 'debit', false, 4401),
('small_4403', 'small_enterprise', 'cost', '4403', '机械作业', '机械作业', NULL, 1, true, 'debit', false, 4403),

-- 损益类科目 - 收入
('small_5001', 'small_enterprise', 'profit_loss', '5001', '主营业务收入', '主营业务收入', NULL, 1, true, 'credit', true, 5001),
('small_5051', 'small_enterprise', 'profit_loss', '5051', '其他业务收入', '其他业务收入', NULL, 1, true, 'credit', false, 5051),
('small_5111', 'small_enterprise', 'profit_loss', '5111', '投资收益', '投资收益', NULL, 1, true, 'credit', false, 5111),
('small_5301', 'small_enterprise', 'profit_loss', '5301', '营业外收入', '营业外收入', NULL, 1, true, 'credit', false, 5301),

-- 损益类科目 - 费用
('small_5401', 'small_enterprise', 'profit_loss', '5401', '主营业务成本', '主营业务成本', NULL, 1, true, 'debit', true, 5401),
('small_5402', 'small_enterprise', 'profit_loss', '5402', '其他业务成本', '其他业务成本', NULL, 1, true, 'debit', false, 5402),
('small_5403', 'small_enterprise', 'profit_loss', '5403', '营业税金及附加', '营业税金及附加', NULL, 1, true, 'debit', false, 5403),
('small_5601', 'small_enterprise', 'profit_loss', '5601', '销售费用', '销售费用', NULL, 1, false, 'debit', false, 5601),
('small_5602', 'small_enterprise', 'profit_loss', '5602', '管理费用', '管理费用', NULL, 1, false, 'debit', false, 5602),
('small_5603', 'small_enterprise', 'profit_loss', '5603', '财务费用', '财务费用', NULL, 1, false, 'debit', false, 5603),
('small_5711', 'small_enterprise', 'profit_loss', '5711', '营业外支出', '营业外支出', NULL, 1, true, 'debit', false, 5711),
('small_5801', 'small_enterprise', 'profit_loss', '5801', '所得税费用', '所得税费用', NULL, 1, true, 'debit', false, 5801);

-- =============================================
-- 资产负债表模板（小企业会计准则）
-- =============================================

INSERT INTO report_items (id, template_id, row_code, item_code, item_name, level, is_subtotal, is_total, formula, subject_codes, row_order) VALUES
-- 资产部分
('sb_001', 'small_balance', '1', 'A001', '流动资产：', 1, false, false, NULL, NULL, 1),
('sb_002', 'small_balance', '2', 'A002', '货币资金', 2, false, false, 'SUM', '["1001", "1002", "1012"]', 2),
('sb_003', 'small_balance', '3', 'A003', '短期投资', 2, false, false, 'END', '["1101"]', 3),
('sb_004', 'small_balance', '4', 'A004', '应收票据', 2, false, false, 'END', '["1121"]', 4),
('sb_005', 'small_balance', '5', 'A005', '应收账款', 2, false, false, 'END', '["1122"]', 5),
('sb_006', 'small_balance', '6', 'A006', '预付账款', 2, false, false, 'END', '["1123"]', 6),
('sb_007', 'small_balance', '7', 'A007', '应收股利', 2, false, false, 'END', '["1131"]', 7),
('sb_008', 'small_balance', '8', 'A008', '应收利息', 2, false, false, 'END', '["1132"]', 8),
('sb_009', 'small_balance', '9', 'A009', '其他应收款', 2, false, false, 'END', '["1221"]', 9),
('sb_010', 'small_balance', '10', 'A010', '存货', 2, false, false, 'SUM', '["1401", "1402", "1403", "1404", "1405", "1407", "1408", "1411", "1421"]', 10),
('sb_011', 'small_balance', '11', 'A011', '其他流动资产', 2, false, false, 'END', '[]', 11),
('sb_012', 'small_balance', '12', 'A012', '流动资产合计', 2, true, false, 'SUM_ROWS', '["A002", "A003", "A004", "A005", "A006", "A007", "A008", "A009", "A010", "A011"]', 12),
('sb_013', 'small_balance', '13', 'A013', '非流动资产：', 1, false, false, NULL, NULL, 13),
('sb_014', 'small_balance', '14', 'A014', '长期债券投资', 2, false, false, 'END', '["1501"]', 14),
('sb_015', 'small_balance', '15', 'A015', '长期股权投资', 2, false, false, 'END', '["1511"]', 15),
('sb_016', 'small_balance', '16', 'A016', '固定资产原价', 2, false, false, 'END', '["1601"]', 16),
('sb_017', 'small_balance', '17', 'A017', '减：累计折旧', 2, false, false, 'END', '["1602"]', 17),
('sb_018', 'small_balance', '18', 'A018', '固定资产账面价值', 2, false, false, 'CALC', '["A016", "-", "A017"]', 18),
('sb_019', 'small_balance', '19', 'A019', '在建工程', 2, false, false, 'END', '["1604"]', 19),
('sb_020', 'small_balance', '20', 'A020', '工程物资', 2, false, false, 'END', '["1605"]', 20),
('sb_021', 'small_balance', '21', 'A021', '固定资产清理', 2, false, false, 'END', '["1606"]', 21),
('sb_022', 'small_balance', '22', 'A022', '生产性生物资产', 2, false, false, 'END', '["1621"]', 22),
('sb_023', 'small_balance', '23', 'A023', '无形资产', 2, false, false, 'END', '["1701"]', 23),
('sb_024', 'small_balance', '24', 'A024', '开发支出', 2, false, false, 'END', '["4301"]', 24),
('sb_025', 'small_balance', '25', 'A025', '长期待摊费用', 2, false, false, 'END', '["1801"]', 25),
('sb_026', 'small_balance', '26', 'A026', '其他非流动资产', 2, false, false, 'END', '[]', 26),
('sb_027', 'small_balance', '27', 'A027', '非流动资产合计', 2, true, false, 'SUM_ROWS', '["A014", "A015", "A018", "A019", "A020", "A021", "A022", "A023", "A024", "A025", "A026"]', 27),
('sb_028', 'small_balance', '28', 'A028', '资产总计', 2, false, true, 'SUM_ROWS', '["A012", "A027"]', 28),

-- 负债部分
('sb_029', 'small_balance', '29', 'L001', '流动负债：', 1, false, false, NULL, NULL, 29),
('sb_030', 'small_balance', '30', 'L002', '短期借款', 2, false, false, 'END', '["2001"]', 30),
('sb_031', 'small_balance', '31', 'L003', '应付票据', 2, false, false, 'END', '["2201"]', 31),
('sb_032', 'small_balance', '32', 'L004', '应付账款', 2, false, false, 'END', '["2202"]', 32),
('sb_033', 'small_balance', '33', 'L005', '预收账款', 2, false, false, 'END', '["2203"]', 33),
('sb_034', 'small_balance', '34', 'L006', '应付职工薪酬', 2, false, false, 'END', '["2211"]', 34),
('sb_035', 'small_balance', '35', 'L007', '应交税费', 2, false, false, 'END', '["2221"]', 35),
('sb_036', 'small_balance', '36', 'L008', '应付利息', 2, false, false, 'END', '["2231"]', 36),
('sb_037', 'small_balance', '37', 'L009', '应付利润', 2, false, false, 'END', '["2232"]', 37),
('sb_038', 'small_balance', '38', 'L010', '其他应付款', 2, false, false, 'END', '["2241"]', 38),
('sb_039', 'small_balance', '39', 'L011', '其他流动负债', 2, false, false, 'END', '[]', 39),
('sb_040', 'small_balance', '40', 'L012', '流动负债合计', 2, true, false, 'SUM_ROWS', '["L002", "L003", "L004", "L005", "L006", "L007", "L008", "L009", "L010", "L011"]', 40),
('sb_041', 'small_balance', '41', 'L013', '非流动负债：', 1, false, false, NULL, NULL, 41),
('sb_042', 'small_balance', '42', 'L014', '长期借款', 2, false, false, 'END', '["2501"]', 42),
('sb_043', 'small_balance', '43', 'L015', '长期应付款', 2, false, false, 'END', '["2701"]', 43),
('sb_044', 'small_balance', '44', 'L016', '递延收益', 2, false, false, 'END', '["2401"]', 44),
('sb_045', 'small_balance', '45', 'L017', '其他非流动负债', 2, false, false, 'END', '[]', 45),
('sb_046', 'small_balance', '46', 'L018', '非流动负债合计', 2, true, false, 'SUM_ROWS', '["L014", "L015", "L016", "L017"]', 46),
('sb_047', 'small_balance', '47', 'L019', '负债合计', 2, false, true, 'SUM_ROWS', '["L012", "L018"]', 47),

-- 所有者权益部分
('sb_048', 'small_balance', '48', 'E001', '所有者权益（或股东权益）：', 1, false, false, NULL, NULL, 48),
('sb_049', 'small_balance', '49', 'E002', '实收资本（或股本）', 2, false, false, 'END', '["3001"]', 49),
('sb_050', 'small_balance', '50', 'E003', '资本公积', 2, false, false, 'END', '["3002"]', 50),
('sb_051', 'small_balance', '51', 'E004', '盈余公积', 2, false, false, 'END', '["3101"]', 51),
('sb_052', 'small_balance', '52', 'E005', '未分配利润', 2, false, false, 'END', '["3103", "3104"]', 52),
('sb_053', 'small_balance', '53', 'E006', '所有者权益（或股东权益）合计', 2, true, false, 'SUM_ROWS', '["E002", "E003", "E004", "E005"]', 53),
('sb_054', 'small_balance', '54', 'E007', '负债和所有者权益（或股东权益）总计', 2, false, true, 'SUM_ROWS', '["L019", "E006"]', 54);
