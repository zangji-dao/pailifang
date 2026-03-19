-- 入驻管理相关表迁移
-- 执行时间: 2026-03-19

-- ============================================
-- 1. 注册地址表（地址资源池）
-- ============================================
CREATE TABLE IF NOT EXISTS registered_addresses (
	id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	code VARCHAR(50) NOT NULL,
	full_address VARCHAR(500) NOT NULL,
	building VARCHAR(100),
	floor VARCHAR(20),
	room VARCHAR(50),
	area DECIMAL(10, 2),
	status VARCHAR(20) NOT NULL DEFAULT 'available',
	enterprise_id VARCHAR(36),
	assigned_at TIMESTAMP,
	remarks TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS registered_addresses_code_idx ON registered_addresses(code);
CREATE INDEX IF NOT EXISTS registered_addresses_status_idx ON registered_addresses(status);
CREATE INDEX IF NOT EXISTS registered_addresses_enterprise_id_idx ON registered_addresses(enterprise_id);

COMMENT ON TABLE registered_addresses IS '注册地址表（地址资源池）';
COMMENT ON COLUMN registered_addresses.code IS '地址编码/注册号';
COMMENT ON COLUMN registered_addresses.status IS 'available=可用, reserved=预留, assigned=已分配';

-- ============================================
-- 2. 入驻申请表
-- ============================================
CREATE TABLE IF NOT EXISTS settlement_applications (
	id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	enterprise_name VARCHAR(255) NOT NULL,
	contact_person VARCHAR(100),
	contact_phone VARCHAR(20),
	application_type VARCHAR(20) NOT NULL,
	settlement_type VARCHAR(20) NOT NULL,
	approval_form_url TEXT,
	approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
	approval_date TIMESTAMP,
	rejection_reason TEXT,
	address_id VARCHAR(36),
	address_assigned_at TIMESTAMP,
	enterprise_id VARCHAR(36),
	remarks TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS settlement_applications_enterprise_name_idx ON settlement_applications(enterprise_name);
CREATE INDEX IF NOT EXISTS settlement_applications_approval_status_idx ON settlement_applications(approval_status);
CREATE INDEX IF NOT EXISTS settlement_applications_application_type_idx ON settlement_applications(application_type);
CREATE INDEX IF NOT EXISTS settlement_applications_address_id_idx ON settlement_applications(address_id);
CREATE INDEX IF NOT EXISTS settlement_applications_enterprise_id_idx ON settlement_applications(enterprise_id);

COMMENT ON TABLE settlement_applications IS '入驻申请表';
COMMENT ON COLUMN settlement_applications.application_type IS 'new=新建企业, migration=迁移企业';
COMMENT ON COLUMN settlement_applications.settlement_type IS 'free=免费入驻, paid=付费入驻, tax_commitment=承诺税收入驻';
COMMENT ON COLUMN settlement_applications.approval_status IS 'pending=待提交, submitted=已提交, approved=已通过, rejected=已驳回';

-- ============================================
-- 3. 入驻流程表
-- ============================================
CREATE TABLE IF NOT EXISTS settlement_processes (
	id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	application_id VARCHAR(36) NOT NULL,
	enterprise_id VARCHAR(36),
	process_type VARCHAR(20) NOT NULL,
	current_stage VARCHAR(50),
	stage_progress JSONB,
	started_at TIMESTAMP,
	completed_at TIMESTAMP,
	remarks TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS settlement_processes_application_id_idx ON settlement_processes(application_id);
CREATE INDEX IF NOT EXISTS settlement_processes_enterprise_id_idx ON settlement_processes(enterprise_id);
CREATE INDEX IF NOT EXISTS settlement_processes_current_stage_idx ON settlement_processes(current_stage);

COMMENT ON TABLE settlement_processes IS '入驻流程表';
COMMENT ON COLUMN settlement_processes.process_type IS 'new=新建企业流程, migration=迁移企业流程';
COMMENT ON COLUMN settlement_processes.current_stage IS '当前阶段';
COMMENT ON COLUMN settlement_processes.stage_progress IS '流程进度JSON';

-- ============================================
-- 4. 合同表
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
	id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	enterprise_id VARCHAR(36) NOT NULL,
	application_id VARCHAR(36),
	contract_no VARCHAR(50),
	contract_type VARCHAR(20) NOT NULL,
	rent_amount DECIMAL(12, 2),
	deposit_amount DECIMAL(12, 2),
	tax_commitment DECIMAL(12, 2),
	start_date DATE,
	end_date DATE,
	signed_date DATE,
	status VARCHAR(20) NOT NULL DEFAULT 'draft',
	contract_file_url TEXT,
	remarks TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS contracts_enterprise_id_idx ON contracts(enterprise_id);
CREATE INDEX IF NOT EXISTS contracts_application_id_idx ON contracts(application_id);
CREATE INDEX IF NOT EXISTS contracts_contract_no_idx ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(status);

COMMENT ON TABLE contracts IS '合同表';
COMMENT ON COLUMN contracts.contract_type IS 'free=免费入驻, paid=付费入驻, tax_commitment=承诺税收入驻';
COMMENT ON COLUMN contracts.status IS 'draft=草稿, pending=待签, signed=已签, expired=已到期, terminated=已终止';

-- ============================================
-- 5. 费用记录表
-- ============================================
CREATE TABLE IF NOT EXISTS settlement_payments (
	id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	enterprise_id VARCHAR(36),
	application_id VARCHAR(36),
	contract_id VARCHAR(36),
	payment_type VARCHAR(20) NOT NULL,
	amount DECIMAL(12, 2) NOT NULL,
	paid_amount DECIMAL(12, 2),
	payment_method VARCHAR(20),
	payment_date TIMESTAMP,
	payment_voucher TEXT,
	status VARCHAR(20) NOT NULL DEFAULT 'pending',
	remarks TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS settlement_payments_enterprise_id_idx ON settlement_payments(enterprise_id);
CREATE INDEX IF NOT EXISTS settlement_payments_application_id_idx ON settlement_payments(application_id);
CREATE INDEX IF NOT EXISTS settlement_payments_contract_id_idx ON settlement_payments(contract_id);
CREATE INDEX IF NOT EXISTS settlement_payments_status_idx ON settlement_payments(status);

COMMENT ON TABLE settlement_payments IS '费用记录表';
COMMENT ON COLUMN settlement_payments.payment_type IS 'deposit=押金, rent=租金, service_fee=服务费, other=其他';
COMMENT ON COLUMN settlement_payments.status IS 'pending=待收, partial=部分收取, paid=已收, refunded=已退';
