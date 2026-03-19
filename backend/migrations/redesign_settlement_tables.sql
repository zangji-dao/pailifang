-- ============================================
-- 重新设计入驻管理相关表
-- 基于入园审批表设计
-- ============================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS pi_settlement_payments CASCADE;
DROP TABLE IF EXISTS pi_settlement_contracts CASCADE;
DROP TABLE IF EXISTS pi_settlement_processes CASCADE;
DROP TABLE IF EXISTS pi_settlement_applications CASCADE;
DROP TABLE IF EXISTS pi_settlement_addresses CASCADE;

-- 2. 创建入驻申请表（完整版）
CREATE TABLE pi_settlement_applications (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ===== 申请编号 =====
  application_no VARCHAR(50) NOT NULL,  -- 编号，如 "2025年11月10日"
  application_date DATE,  -- 申请日期
  
  -- ===== 企业基本信息 =====
  enterprise_name VARCHAR(255) NOT NULL,  -- 申请名称（企业名称）
  enterprise_name_backup VARCHAR(255),  -- 备用名
  registered_capital DECIMAL(12,2),  -- 注册资金（万元）
  currency_type VARCHAR(20) DEFAULT 'CNY',  -- 币种：CNY=人民币, USD=美元等
  tax_type VARCHAR(20),  -- 缴税类型：general=一般纳税人, small_scale=小规模
  
  -- ===== 预计经营数据 =====
  expected_annual_revenue DECIMAL(12,2),  -- 预计主营收入（年/万元）
  expected_annual_tax DECIMAL(12,2),  -- 预计全口径税收（年/万元）
  
  -- ===== 地址信息 =====
  original_registered_address VARCHAR(500),  -- 原注册地址（迁移企业填写）
  mailing_address VARCHAR(500),  -- 邮寄地址
  business_address VARCHAR(500),  -- 实际经营地址
  assigned_address_id VARCHAR(36),  -- 分配的注册地址ID
  assigned_address VARCHAR(500),  -- 分配的注册地址（园区提供）
  
  -- ===== 法人信息 =====
  legal_person_name VARCHAR(100),  -- 法人姓名
  legal_person_phone VARCHAR(20),  -- 法人电话
  legal_person_email VARCHAR(100),  -- 法人邮箱
  legal_person_address VARCHAR(500),  -- 法人住址
  
  -- ===== 股东信息 (JSON数组) =====
  -- 格式: [{"name": "股东姓名", "investment": 出资额, "phone": "联系电话"}, ...]
  shareholders JSONB,
  
  -- ===== 监事信息 =====
  supervisor_name VARCHAR(100),  -- 监事姓名
  supervisor_phone VARCHAR(20),  -- 监事电话
  
  -- ===== 财务负责人信息 =====
  finance_manager_name VARCHAR(100),  -- 财务负责人姓名
  finance_manager_phone VARCHAR(20),  -- 财务负责人电话
  
  -- ===== 实际联络人信息 =====
  contact_person_name VARCHAR(100),  -- 实际联络人姓名
  contact_person_phone VARCHAR(20),  -- 实际联络人电话
  
  -- ===== e窗通联系人信息 =====
  ewt_contact_name VARCHAR(100),  -- 登录e窗通联系人姓名
  ewt_contact_phone VARCHAR(20),  -- 登录e窗通联系人电话
  
  -- ===== 中介信息 =====
  intermediary_department VARCHAR(100),  -- 中介人所在部门
  intermediary_name VARCHAR(100),  -- 中介人姓名
  intermediary_phone VARCHAR(20),  -- 中介人电话
  
  -- ===== 经营范围 =====
  business_scope TEXT,  -- 经营范围
  
  -- ===== 申请类型 =====
  application_type VARCHAR(20) NOT NULL,  -- new=新建企业, migration=迁移企业
  settlement_type VARCHAR(20),  -- free=免费入驻, paid=付费入驻, tax_commitment=承诺税收入驻
  
  -- ===== 审批信息 =====
  approval_status VARCHAR(20) DEFAULT 'draft' NOT NULL,  -- draft=草稿, pending=待审批, approved=已通过, rejected=已驳回
  approval_opinion TEXT,  -- 部门主要领导意见
  approved_by VARCHAR(36),  -- 审批人ID
  approved_at TIMESTAMP,  -- 审批时间
  rejection_reason TEXT,  -- 驳回原因
  
  -- ===== 关联信息 =====
  enterprise_id VARCHAR(36),  -- 审批通过后创建的企业ID
  process_id VARCHAR(36),  -- 关联的入驻流程ID
  
  -- ===== 附件 =====
  -- 格式: [{"name": "文件名", "url": "文件URL"}, ...]
  attachments JSONB,  -- 身份证照片等附件
  
  -- ===== 状态跟踪 =====
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,  -- draft=草稿, submitted=已提交, processing=处理中, completed=已完成, cancelled=已取消
  
  -- ===== 其他 =====
  remarks TEXT,
  created_by VARCHAR(36),  -- 创建人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ssa_application_no ON pi_settlement_applications(application_no);
CREATE INDEX idx_ssa_enterprise_name ON pi_settlement_applications(enterprise_name);
CREATE INDEX idx_ssa_approval_status ON pi_settlement_applications(approval_status);
CREATE INDEX idx_ssa_application_type ON pi_settlement_applications(application_type);
CREATE INDEX idx_ssa_status ON pi_settlement_applications(status);
CREATE INDEX idx_ssa_enterprise_id ON pi_settlement_applications(enterprise_id);
CREATE INDEX idx_ssa_assigned_address_id ON pi_settlement_applications(assigned_address_id);

-- 3. 创建入驻流程表
CREATE TABLE pi_settlement_processes (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(36) NOT NULL,  -- 关联申请ID
  enterprise_id VARCHAR(36),  -- 关联企业ID
  enterprise_name VARCHAR(255),  -- 企业名称（冗余，方便查询）
  
  -- ===== 流程类型 =====
  process_type VARCHAR(20) NOT NULL,  -- new=新建企业流程(8阶段), migration=迁移企业流程(4阶段)
  
  -- ===== 当前状态 =====
  current_stage VARCHAR(50),  -- 当前阶段
  current_stage_index INTEGER DEFAULT 0,  -- 当前阶段序号
  overall_status VARCHAR(20) DEFAULT 'pending' NOT NULL,  -- pending=待开始, in_progress=进行中, completed=已完成, cancelled=已取消
  
  -- ===== 阶段进度详情 (JSON数组) =====
  -- 新建企业8阶段: approval_passed, address_assigned, pre_approved, pre_approval_done, registered, seal_made, contract_pending, completed
  -- 迁移企业4阶段: approval_passed, address_assigned, contract_pending, completed
  -- 格式: [{
  --   "stage": "阶段标识",
  --   "stageName": "阶段名称",
  --   "stageIndex": 阶段序号,
  --   "status": "pending|in_progress|completed|skipped",
  --   "startedAt": "开始时间",
  --   "completedAt": "完成时间",
  --   "operator": "操作人",
  --   "attachments": [],
  --   "remarks": "备注"
  -- }]
  stages JSONB,
  
  -- ===== 时间节点 =====
  started_at TIMESTAMP,  -- 流程开始时间
  completed_at TIMESTAMP,  -- 流程完成时间
  
  -- ===== 其他 =====
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ssp_application_id ON pi_settlement_processes(application_id);
CREATE INDEX idx_ssp_enterprise_id ON pi_settlement_processes(enterprise_id);
CREATE INDEX idx_ssp_current_stage ON pi_settlement_processes(current_stage);
CREATE INDEX idx_ssp_overall_status ON pi_settlement_processes(overall_status);
CREATE INDEX idx_ssp_process_type ON pi_settlement_processes(process_type);

-- 4. 创建注册地址表
CREATE TABLE pi_registered_addresses (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ===== 地址编码 =====
  address_code VARCHAR(50) NOT NULL UNIQUE,  -- 地址编码/注册号
  
  -- ===== 地址详情 =====
  province VARCHAR(50),  -- 省
  city VARCHAR(50),  -- 市
  district VARCHAR(50),  -- 区
  street VARCHAR(100),  -- 街道
  building VARCHAR(100),  -- 楼宇
  floor VARCHAR(20),  -- 楼层
  room VARCHAR(50),  -- 房间号
  full_address VARCHAR(500) NOT NULL,  -- 完整地址
  
  -- ===== 地址属性 =====
  address_type VARCHAR(20) DEFAULT 'registered',  -- registered=注册地址, office=办公地址
  area DECIMAL(10,2),  -- 面积（平方米）
  
  -- ===== 状态 =====
  status VARCHAR(20) DEFAULT 'available' NOT NULL,  -- available=可用, reserved=预留, assigned=已分配
  enterprise_id VARCHAR(36),  -- 分配的企业ID
  application_id VARCHAR(36),  -- 关联的申请ID
  assigned_at TIMESTAMP,  -- 分配时间
  
  -- ===== 其他 =====
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ra_address_code ON pi_registered_addresses(address_code);
CREATE INDEX idx_ra_status ON pi_registered_addresses(status);
CREATE INDEX idx_ra_enterprise_id ON pi_registered_addresses(enterprise_id);
CREATE INDEX idx_ra_application_id ON pi_registered_addresses(application_id);

-- 5. 创建合同表
CREATE TABLE pi_contracts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ===== 关联信息 =====
  enterprise_id VARCHAR(36) NOT NULL,  -- 关联企业ID
  application_id VARCHAR(36),  -- 关联申请ID
  process_id VARCHAR(36),  -- 关联流程ID
  
  -- ===== 合同基本信息 =====
  contract_no VARCHAR(50) UNIQUE,  -- 合同编号
  contract_name VARCHAR(255),  -- 合同名称
  contract_type VARCHAR(20) NOT NULL,  -- free=免费入驻, paid=付费入驻, tax_commitment=承诺税收入驻
  
  -- ===== 费用相关 =====
  rent_amount DECIMAL(12,2),  -- 租金金额（元/年）
  deposit_amount DECIMAL(12,2),  -- 押金金额（元）
  tax_commitment DECIMAL(12,2),  -- 税收承诺额（万元/年）
  
  -- ===== 合同期限 =====
  start_date DATE,  -- 合同开始日期
  end_date DATE,  -- 合同结束日期
  signed_date DATE,  -- 签署日期
  
  -- ===== 合同状态 =====
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,  -- draft=草稿, pending=待签, signed=已签, active=生效中, expired=已到期, terminated=已终止
  
  -- ===== 合同文件 =====
  contract_file_url TEXT,  -- 合同文件URL
  
  -- ===== 其他 =====
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_con_enterprise_id ON pi_contracts(enterprise_id);
CREATE INDEX idx_con_application_id ON pi_contracts(application_id);
CREATE INDEX idx_con_contract_no ON pi_contracts(contract_no);
CREATE INDEX idx_con_status ON pi_contracts(status);

-- 6. 创建费用记录表
CREATE TABLE pi_settlement_payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ===== 关联信息 =====
  enterprise_id VARCHAR(36),  -- 关联企业ID
  application_id VARCHAR(36),  -- 关联申请ID
  contract_id VARCHAR(36),  -- 关联合同ID
  
  -- ===== 费用信息 =====
  payment_type VARCHAR(20) NOT NULL,  -- deposit=押金, rent=租金, service_fee=服务费, other=其他
  payment_name VARCHAR(100),  -- 费用名称
  amount DECIMAL(12,2) NOT NULL,  -- 应收金额
  paid_amount DECIMAL(12,2),  -- 实收金额
  
  -- ===== 收款信息 =====
  payment_method VARCHAR(20),  -- cash=现金, bank=银行转账, alipay=支付宝, wechat=微信
  payment_date TIMESTAMP,  -- 收款日期
  payment_voucher TEXT,  -- 收款凭证URL
  
  -- ===== 状态 =====
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,  -- pending=待收, partial=部分收取, paid=已收, refunded=已退
  
  -- ===== 其他 =====
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_sp_enterprise_id ON pi_settlement_payments(enterprise_id);
CREATE INDEX idx_sp_application_id ON pi_settlement_payments(application_id);
CREATE INDEX idx_sp_contract_id ON pi_settlement_payments(contract_id);
CREATE INDEX idx_sp_status ON pi_settlement_payments(status);

-- 7. 插入测试地址数据
INSERT INTO pi_registered_addresses (address_code, full_address, status, address_type) VALUES
('REG-2025-001', '吉林省松原市宁江区某某街道某某大厦A座101室', 'available', 'registered'),
('REG-2025-002', '吉林省松原市宁江区某某街道某某大厦A座102室', 'available', 'registered'),
('REG-2025-003', '吉林省松原市宁江区某某街道某某大厦A座103室', 'available', 'registered'),
('REG-2025-004', '吉林省松原市宁江区某某街道某某大厦A座201室', 'available', 'registered'),
('REG-2025-005', '吉林省松原市宁江区某某街道某某大厦A座202室', 'available', 'registered');
