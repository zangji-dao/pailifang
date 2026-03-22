import { pgTable, varchar, text, timestamp, integer, json, boolean, unique, foreignKey, decimal, date, index, serial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customerFollows = pgTable("customer_follows", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	content: text(),
	nextFollowDate: timestamp("next_follow_date"),
	status: varchar({ length: 20 }).default('completed'),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("customer_follows_created_at_idx").on(table.createdAt),
	index("customer_follows_customer_id_idx").on(table.customerId),
	index("customer_follows_user_id_idx").on(table.userId),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().primaryKey().notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const customers = pgTable("customers", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 128 }).notNull(),
	contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	address: text(),
	salesId: varchar("sales_id", { length: 36 }),
	status: varchar({ length: 20 }).default('potential').notNull(),
	notes: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("customers_name_idx").on(table.name),
	index("customers_sales_id_idx").on(table.salesId),
	index("customers_status_idx").on(table.status),
]);

export const ledgers = pgTable("ledgers", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	accountantId: varchar("accountant_id", { length: 36 }).notNull(),
	year: integer().notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	description: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("ledgers_accountant_id_idx").on(table.accountantId),
	index("ledgers_customer_id_idx").on(table.customerId),
	index("ledgers_status_idx").on(table.status),
	index("ledgers_year_idx").on(table.year),
]);

export const profitRules = pgTable("profit_rules", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	salesRate: integer("sales_rate").notNull(),
	accountantRate: integer("accountant_rate").notNull(),
	baseAmount: integer("base_amount").default(0),
	conditions: json(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("profit_rules_is_active_idx").on(table.isActive),
	index("profit_rules_type_idx").on(table.type),
]);

export const profitShares = pgTable("profit_shares", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	customerId: varchar("customer_id", { length: 36 }),
	ledgerId: varchar("ledger_id", { length: 36 }),
	salesId: varchar("sales_id", { length: 36 }),
	accountantId: varchar("accountant_id", { length: 36 }),
	profitRuleId: varchar("profit_rule_id", { length: 36 }).notNull(),
	totalAmount: integer("total_amount").notNull(),
	salesAmount: integer("sales_amount").notNull(),
	accountantAmount: integer("accountant_amount").notNull(),
	period: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	paidAt: timestamp("paid_at"),
	notes: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("profit_shares_accountant_id_idx").on(table.accountantId),
	index("profit_shares_customer_id_idx").on(table.customerId),
	index("profit_shares_period_idx").on(table.period),
	index("profit_shares_sales_id_idx").on(table.salesId),
	index("profit_shares_status_idx").on(table.status),
]);


export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	role: varchar({ length: 20 }).default('accountant').notNull(),
	phone: varchar({ length: 20 }),
	avatar: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: json(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("users_email_idx").on(table.email),
	index("users_role_idx").on(table.role),
	unique("users_email_unique").on(table.email),
]);

export const workOrders = pgTable("work_orders", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	customerId: varchar("customer_id", { length: 36 }),
	ledgerId: varchar("ledger_id", { length: 36 }),
	assignedTo: varchar("assigned_to", { length: 36 }).notNull(),
	createdBy: varchar("created_by", { length: 36 }).notNull(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	dueDate: timestamp("due_date"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("work_orders_assigned_to_idx").on(table.assignedTo),
	index("work_orders_customer_id_idx").on(table.customerId),
	index("work_orders_ledger_id_idx").on(table.ledgerId),
	index("work_orders_priority_idx").on(table.priority),
	index("work_orders_status_idx").on(table.status),
]);

export const chartOfAccounts = pgTable("chart_of_accounts", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	ledgerId: varchar("ledger_id", { length: 36 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	parentId: varchar("parent_id", { length: 36 }),
	level: integer().default(1).notNull(),
	type: varchar({ length: 20 }).notNull(),
	direction: varchar({ length: 10 }).notNull(),
	isLeaf: boolean("is_leaf").default(true).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	remark: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("coa_code_idx").on(table.code),
	index("coa_ledger_id_idx").on(table.ledgerId),
	index("coa_level_idx").on(table.level),
	index("coa_parent_id_idx").on(table.parentId),
	index("coa_type_idx").on(table.type),
]);

export const auxiliaryTypes = pgTable("auxiliary_types", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	isSystem: boolean("is_system").default(false).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("at_code_idx").on(table.code),
	index("at_status_idx").on(table.status),
]);

export const auxiliaryItems = pgTable("auxiliary_items", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	typeId: varchar("type_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	parentId: varchar("parent_id", { length: 36 }),
	fullCode: varchar("full_code", { length: 200 }),
	fullName: varchar("full_name", { length: 500 }),
	isLeaf: boolean("is_leaf").default(true).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	remark: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("ai_code_idx").on(table.code),
	index("ai_full_code_idx").on(table.fullCode),
	index("ai_parent_id_idx").on(table.parentId),
	index("ai_status_idx").on(table.status),
	index("ai_type_id_idx").on(table.typeId),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [auxiliaryTypes.id],
			name: "fk_auxiliary_item_type"
		}).onDelete("cascade"),
]);

export const accountAuxiliarySettings = pgTable("account_auxiliary_settings", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	accountId: varchar("account_id", { length: 36 }).notNull(),
	auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(),
	isRequired: boolean("is_required").default(false).notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("aas_account_id_idx").on(table.accountId),
	index("aas_auxiliary_type_id_idx").on(table.auxiliaryTypeId),
	foreignKey({
			columns: [table.auxiliaryTypeId],
			foreignColumns: [auxiliaryTypes.id],
			name: "fk_aas_auxiliary_type"
		}).onDelete("cascade"),
	unique("uq_account_auxiliary").on(table.accountId, table.auxiliaryTypeId),
]);

export const auxiliaryBalances = pgTable("auxiliary_balances", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	ledgerId: varchar("ledger_id", { length: 36 }).notNull(),
	accountId: varchar("account_id", { length: 36 }).notNull(),
	accountCode: varchar("account_code", { length: 20 }).notNull(),
	auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(),
	auxiliaryItemId: varchar("auxiliary_item_id", { length: 36 }).notNull(),
	auxiliaryItemCode: varchar("auxiliary_item_code", { length: 50 }).notNull(),
	auxiliaryItemName: varchar("auxiliary_item_name", { length: 200 }).notNull(),
	period: varchar({ length: 20 }).notNull(),
	beginningDebit: decimal("beginning_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	beginningCredit: decimal("beginning_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	currentDebit: decimal("current_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	currentCredit: decimal("current_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	endingDebit: decimal("ending_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	endingCredit: decimal("ending_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	direction: varchar({ length: 10 }).notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ab_account_id_idx").on(table.accountId),
	index("ab_auxiliary_item_id_idx").on(table.auxiliaryItemId),
	index("ab_auxiliary_type_id_idx").on(table.auxiliaryTypeId),
	index("ab_ledger_id_idx").on(table.ledgerId),
	index("ab_period_idx").on(table.period),
	index("ab_unique_idx").on(table.ledgerId, table.accountId, table.auxiliaryTypeId, table.auxiliaryItemId, table.period),
	foreignKey({
			columns: [table.auxiliaryItemId],
			foreignColumns: [auxiliaryItems.id],
			name: "fk_ab_auxiliary_item"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.auxiliaryTypeId],
			foreignColumns: [auxiliaryTypes.id],
			name: "fk_ab_auxiliary_type"
		}).onDelete("cascade"),
]);

export const currencies = pgTable("currencies", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	symbol: varchar({ length: 10 }),
	exchangeRate: decimal("exchange_rate", { precision: 18, scale:  6 }).default('1').notNull(),
	isBase: boolean("is_base").default(false).notNull(),
	decimalPlaces: integer("decimal_places").default(2).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: integer("sort_order").default(0),
	remark: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("currency_code_idx").on(table.code),
	index("currency_status_idx").on(table.status),
	unique("currencies_code_key").on(table.code),
]);

export const exchangeRateHistory = pgTable("exchange_rate_history", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	currencyId: varchar("currency_id", { length: 36 }).notNull(),
	currencyCode: varchar("currency_code", { length: 10 }).notNull(),
	rateDate: date("rate_date").notNull(),
	exchangeRate: decimal("exchange_rate", { precision: 18, scale:  6 }).notNull(),
	source: varchar({ length: 50 }),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});


// ==================== 基地管理相关表 ====================

// 基地表
export const bases = pgTable("bases", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text(),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("bases_name_idx").on(table.name),
	index("bases_status_idx").on(table.status),
]);

// 企业表
export const enterprises = pgTable("enterprises", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	creditCode: varchar("credit_code", { length: 50 }),
	legalPerson: varchar("legal_person", { length: 100 }),
	phone: varchar({ length: 20 }),
	registeredAddress: varchar("registered_address", { length: 500 }),
	businessAddress: varchar("business_address", { length: 500 }),
	industry: varchar({ length: 100 }),
	settledDate: timestamp("settled_date"),
	type: varchar({ length: 20 }).default('tenant').notNull(), // tenant=入驻企业, service=服务企业
	status: varchar({ length: 20 }).default('active').notNull(),
	remarks: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("enterprises_credit_code_idx").on(table.creditCode),
	index("enterprises_name_idx").on(table.name),
	index("enterprises_type_idx").on(table.type),
]);

// ============================================
// 入驻管理相关表
// ============================================

// 注册地址表
export const registeredAddresses = pgTable("pi_registered_addresses", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	addressCode: varchar("address_code", { length: 50 }).notNull(),
	province: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	district: varchar({ length: 50 }),
	street: varchar({ length: 100 }),
	building: varchar({ length: 100 }),
	floor: varchar({ length: 20 }),
	room: varchar({ length: 50 }),
	fullAddress: varchar("full_address", { length: 500 }).notNull(),
	addressType: varchar("address_type", { length: 20 }).default('registered'),
	area: decimal("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('available').notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	applicationId: varchar("application_id", { length: 36 }),
	assignedAt: timestamp("assigned_at"),
	remarks: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("idx_ra_address_code").on(table.addressCode),
	index("idx_ra_status").on(table.status),
	index("idx_ra_enterprise_id").on(table.enterpriseId),
	index("idx_ra_application_id").on(table.applicationId),
]);

// 股东信息类型
export type Shareholder = {
	type: 'natural' | 'enterprise'; // natural=自然人股东, enterprise=企业股东
	name: string;
	investment: number;
	phone: string;
	// 自然人股东 - 身份证
	idCardFrontKey?: string;
	idCardFrontUrl?: string;
	idCardBackKey?: string;
	idCardBackUrl?: string;
	// 企业股东 - 营业执照
	licenseKey?: string;
	licenseUrl?: string;
};

// 附件信息类型
export type Attachment = {
	name: string;
	url: string;
	type?: string;
};

// 人员信息类型
export type Personnel = {
	name: string;
	phone: string;
	roles: string[]; // legal_person, supervisor, finance_manager, contact_person
	idCardFrontKey?: string;
	idCardFrontUrl?: string;
	idCardBackKey?: string;
	idCardBackUrl?: string;
};

// 入驻申请表（完整版）
export const settlementApplications = pgTable("pi_settlement_applications", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	
	// 申请编号
	applicationNo: varchar("application_no", { length: 50 }).notNull(),
	applicationDate: date("application_date"),
	
	// 企业基本信息
	enterpriseName: varchar("enterprise_name", { length: 255 }).notNull(),
	enterpriseNameBackups: json("enterprise_name_backups").$type<string[]>(),
	registeredCapital: decimal("registered_capital", { precision: 12, scale: 2 }),
	currencyType: varchar("currency_type", { length: 20 }).default('CNY'),
	taxType: varchar("tax_type", { length: 20 }),
	
	// 预计经营数据
	expectedAnnualRevenue: decimal("expected_annual_revenue", { precision: 12, scale: 2 }),
	expectedAnnualTax: decimal("expected_annual_tax", { precision: 12, scale: 2 }),
	
	// 地址信息
	originalRegisteredAddress: varchar("original_registered_address", { length: 500 }),
	mailingAddress: varchar("mailing_address", { length: 500 }),
	businessAddress: varchar("business_address", { length: 500 }),
	assignedAddressId: varchar("assigned_address_id", { length: 36 }),
	assignedAddress: varchar("assigned_address", { length: 500 }),
	
	// 法人信息
	legalPersonName: varchar("legal_person_name", { length: 100 }),
	legalPersonPhone: varchar("legal_person_phone", { length: 20 }),
	legalPersonEmail: varchar("legal_person_email", { length: 100 }),
	legalPersonAddress: varchar("legal_person_address", { length: 500 }),
	
	// 股东信息
	shareholders: json("shareholders").$type<Shareholder[]>(),
	
	// 人员信息（新版）
	personnel: json("personnel").$type<Personnel[]>(),
	
	// 监事信息
	supervisorName: varchar("supervisor_name", { length: 100 }),
	supervisorPhone: varchar("supervisor_phone", { length: 20 }),
	
	// 财务负责人信息
	financeManagerName: varchar("finance_manager_name", { length: 100 }),
	financeManagerPhone: varchar("finance_manager_phone", { length: 20 }),
	
	// 实际联络人信息
	contactPersonName: varchar("contact_person_name", { length: 100 }),
	contactPersonPhone: varchar("contact_person_phone", { length: 20 }),
	
	// e窗通联系人信息
	ewtContactName: varchar("ewt_contact_name", { length: 100 }),
	ewtContactPhone: varchar("ewt_contact_phone", { length: 20 }),
	
	// 中介信息
	intermediaryDepartment: varchar("intermediary_department", { length: 100 }),
	intermediaryName: varchar("intermediary_name", { length: 100 }),
	intermediaryPhone: varchar("intermediary_phone", { length: 20 }),
	
	// 经营范围
	businessScope: text("business_scope"),
	
	// 申请类型
	applicationType: varchar("application_type", { length: 20 }).notNull(),
	settlementType: varchar("settlement_type", { length: 20 }),
	
	// 审批信息
	approvalStatus: varchar("approval_status", { length: 20 }).default('draft').notNull(),
	approvalOpinion: text("approval_opinion"),
	approvedBy: varchar("approved_by", { length: 36 }),
	approvedAt: timestamp("approved_at"),
	rejectionReason: text("rejection_reason"),
	
	// 关联信息
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	processId: varchar("process_id", { length: 36 }),
	
	// 附件
	attachments: json("attachments").$type<Attachment[]>(),
	
	// 状态
	status: varchar({ length: 20 }).default('draft').notNull(),
	
	// 其他
	remarks: text(),
	createdBy: varchar("created_by", { length: 36 }),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("idx_ssa_application_no").on(table.applicationNo),
	index("idx_ssa_enterprise_name").on(table.enterpriseName),
	index("idx_ssa_approval_status").on(table.approvalStatus),
	index("idx_ssa_application_type").on(table.applicationType),
	index("idx_ssa_status").on(table.status),
	index("idx_ssa_enterprise_id").on(table.enterpriseId),
	index("idx_ssa_assigned_address_id").on(table.assignedAddressId),
]);

// 流程阶段类型
export type StageProgress = {
	stage: string;
	stageName: string;
	stageIndex: number;
	status: 'pending' | 'in_progress' | 'completed' | 'skipped';
	startedAt?: string;
	completedAt?: string;
	operator?: string;
	attachments?: Attachment[];
	remarks?: string;
};

// 入驻流程表
export const settlementProcesses = pgTable("pi_settlement_processes", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	applicationId: varchar("application_id", { length: 36 }).notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	enterpriseName: varchar("enterprise_name", { length: 255 }),
	
	// 流程类型
	processType: varchar("process_type", { length: 20 }).notNull(),
	
	// 当前状态
	currentStage: varchar("current_stage", { length: 50 }),
	currentStageIndex: integer("current_stage_index").default(0),
	overallStatus: varchar("overall_status", { length: 20 }).default('pending').notNull(),
	
	// 阶段进度
	stages: json("stages").$type<StageProgress[]>(),
	
	// 时间节点
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	
	// 其他
	remarks: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("idx_ssp_application_id").on(table.applicationId),
	index("idx_ssp_enterprise_id").on(table.enterpriseId),
	index("idx_ssp_current_stage").on(table.currentStage),
	index("idx_ssp_overall_status").on(table.overallStatus),
	index("idx_ssp_process_type").on(table.processType),
]);

// 合同表
export const contracts = pgTable("pi_contracts", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }).notNull(),
	applicationId: varchar("application_id", { length: 36 }),
	processId: varchar("process_id", { length: 36 }),
	
	// 合同基本信息
	contractNo: varchar("contract_no", { length: 50 }),
	contractName: varchar("contract_name", { length: 255 }),
	contractType: varchar("contract_type", { length: 20 }).notNull(),
	
	// 费用相关
	rentAmount: decimal("rent_amount", { precision: 12, scale: 2 }),
	depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }),
	taxCommitment: decimal("tax_commitment", { precision: 12, scale: 2 }),
	
	// 合同期限
	startDate: date("start_date"),
	endDate: date("end_date"),
	signedDate: date("signed_date"),
	
	// 合同状态
	status: varchar({ length: 20 }).default('draft').notNull(),
	
	// 合同文件
	contractFileUrl: text("contract_file_url"),
	
	// 其他
	remarks: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("idx_con_enterprise_id").on(table.enterpriseId),
	index("idx_con_application_id").on(table.applicationId),
	index("idx_con_contract_no").on(table.contractNo),
	index("idx_con_status").on(table.status),
]);

// 费用记录表
export const settlementPayments = pgTable("pi_settlement_payments", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	applicationId: varchar("application_id", { length: 36 }),
	contractId: varchar("contract_id", { length: 36 }),
	
	// 费用信息
	paymentType: varchar("payment_type", { length: 20 }).notNull(),
	paymentName: varchar("payment_name", { length: 100 }),
	amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
	paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
	
	// 收款信息
	paymentMethod: varchar("payment_method", { length: 20 }),
	paymentDate: timestamp("payment_date"),
	paymentVoucher: text("payment_voucher"),
	
	// 状态
	status: varchar({ length: 20 }).default('pending').notNull(),
	
	// 其他
	remarks: text(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("idx_sp_enterprise_id").on(table.enterpriseId),
	index("idx_sp_application_id").on(table.applicationId),
	index("idx_sp_contract_id").on(table.contractId),
	index("idx_sp_status").on(table.status),
]);

// 物业表（独立水电计量单元）
export const meters = pgTable("meters", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	baseId: varchar("base_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	// 电表
	electricityNumber: varchar("electricity_number", { length: 50 }),
	electricityType: varchar("electricity_type", { length: 20 }).default('base'), // base=基地负责, customer=客户负责
	electricityStatus: varchar("electricity_status", { length: 20 }).default('normal'), // normal=正常, abnormal=异常
	electricityEnterpriseId: varchar("electricity_enterprise_id", { length: 36 }),
	// 水表
	waterNumber: varchar("water_number", { length: 50 }),
	waterType: varchar("water_type", { length: 20 }).default('base'),
	waterStatus: varchar("water_status", { length: 20 }).default('normal'),
	waterEnterpriseId: varchar("water_enterprise_id", { length: 36 }),
	// 取暖
	heatingNumber: varchar("heating_number", { length: 50 }),
	heatingType: varchar("heating_type", { length: 20 }).default('base'),
	heatingStatus: varchar("heating_status", { length: 20 }).default('normal'),
	heatingEnterpriseId: varchar("heating_enterprise_id", { length: 36 }),
	// 网络
	networkNumber: varchar("network_number", { length: 50 }),
	networkType: varchar("network_type", { length: 20 }).default('base'),
	networkStatus: varchar("network_status", { length: 20 }).default('normal'),
	// 面积
	area: decimal("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("meters_base_id_idx").on(table.baseId),
	index("meters_code_idx").on(table.code),
	index("meters_enterprise_id_idx").on(table.enterpriseId),
	foreignKey({
			columns: [table.baseId],
			foreignColumns: [bases.id],
			name: "fk_meters_base"
		}).onDelete("cascade"),
]);

// 物理空间表
export const spaces = pgTable("spaces", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	meterId: varchar("meter_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	area: decimal("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("spaces_meter_id_idx").on(table.meterId),
	index("spaces_code_idx").on(table.code),
	foreignKey({
			columns: [table.meterId],
			foreignColumns: [meters.id],
			name: "fk_spaces_meter"
		}).onDelete("cascade"),
]);

// 注册号表
export const regNumbers = pgTable("reg_numbers", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	spaceId: varchar("space_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('available').notNull(), // available=可用, allocated=已分配, reserved=预留
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("reg_numbers_code_idx").on(table.code),
	index("reg_numbers_space_id_idx").on(table.spaceId),
	index("reg_numbers_status_idx").on(table.status),
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [spaces.id],
			name: "fk_reg_numbers_space"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.enterpriseId],
			foreignColumns: [enterprises.id],
			name: "fk_reg_numbers_enterprise"
		}).onDelete("set null"),
]);

// 支付宝授权表
export const alipayAuthTokens = pgTable("alipay_auth_tokens", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	alipayUserId: varchar("alipay_user_id", { length: 64 }).notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresIn: integer("expires_in").notNull(),
	reExpiresIn: integer("re_expires_in").notNull(),
	tokenType: varchar("token_type", { length: 20 }).default('Bearer'),
	authTime: timestamp("auth_time").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	refreshExpiresAt: timestamp("refresh_expires_at").notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at"),
}, (table) => [
	index("alipay_auth_tokens_user_id_idx").on(table.userId),
	index("alipay_auth_tokens_alipay_user_id_idx").on(table.alipayUserId),
]);
