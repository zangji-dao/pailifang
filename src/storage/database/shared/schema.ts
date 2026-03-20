// 声明 PostgreSQL 函数
declare function gen_random_uuid(): string;

import { pgTable, index, varchar, text, timestamp, serial, integer, jsonb, boolean, unique, numeric, uuid, foreignKey, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customerFollows = pgTable("customer_follows", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	content: text(),
	nextFollowDate: timestamp("next_follow_date", { withTimezone: true, mode: 'string' }),
	status: varchar({ length: 20 }).default('completed'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("customer_follows_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("customer_follows_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("customer_follows_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const customers = pgTable("customers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 128 }).notNull(),
	contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	address: text(),
	salesId: varchar("sales_id", { length: 36 }),
	status: varchar({ length: 20 }).default('potential').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("customers_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("customers_sales_id_idx").using("btree", table.salesId.asc().nullsLast().op("text_ops")),
	index("customers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const ledgers = pgTable("ledgers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	accountantId: varchar("accountant_id", { length: 36 }).notNull(),
	year: integer().notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("ledgers_accountant_id_idx").using("btree", table.accountantId.asc().nullsLast().op("text_ops")),
	index("ledgers_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("ledgers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ledgers_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
]);

export const profitRules = pgTable("profit_rules", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	salesRate: integer("sales_rate").notNull(),
	accountantRate: integer("accountant_rate").notNull(),
	baseAmount: integer("base_amount").default(0),
	conditions: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profit_rules_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("profit_rules_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const profitShares = pgTable("profit_shares", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
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
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profit_shares_accountant_id_idx").using("btree", table.accountantId.asc().nullsLast().op("text_ops")),
	index("profit_shares_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("profit_shares_period_idx").using("btree", table.period.asc().nullsLast().op("text_ops")),
	index("profit_shares_sales_id_idx").using("btree", table.salesId.asc().nullsLast().op("text_ops")),
	index("profit_shares_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	role: varchar({ length: 20 }).default('accountant').notNull(),
	phone: varchar({ length: 20 }),
	avatar: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const workOrders = pgTable("work_orders", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	customerId: varchar("customer_id", { length: 36 }),
	ledgerId: varchar("ledger_id", { length: 36 }),
	assignedTo: varchar("assigned_to", { length: 36 }).notNull(),
	createdBy: varchar("created_by", { length: 36 }).notNull(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("work_orders_assigned_to_idx").using("btree", table.assignedTo.asc().nullsLast().op("text_ops")),
	index("work_orders_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("work_orders_ledger_id_idx").using("btree", table.ledgerId.asc().nullsLast().op("text_ops")),
	index("work_orders_priority_idx").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("work_orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const piSettlementPayments = pgTable("pi_settlement_payments", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	applicationId: varchar("application_id", { length: 36 }),
	contractId: varchar("contract_id", { length: 36 }),
	paymentType: varchar("payment_type", { length: 20 }).notNull(),
	paymentName: varchar("payment_name", { length: 100 }),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 12, scale:  2 }),
	paymentMethod: varchar("payment_method", { length: 20 }),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	paymentVoucher: text("payment_voucher"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_sp_application_id").using("btree", table.applicationId.asc().nullsLast().op("text_ops")),
	index("idx_sp_contract_id").using("btree", table.contractId.asc().nullsLast().op("text_ops")),
	index("idx_sp_enterprise_id").using("btree", table.enterpriseId.asc().nullsLast().op("text_ops")),
	index("idx_sp_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const chartOfAccounts = pgTable("chart_of_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
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
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("coa_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("coa_ledger_id_idx").using("btree", table.ledgerId.asc().nullsLast().op("text_ops")),
	index("coa_level_idx").using("btree", table.level.asc().nullsLast().op("int4_ops")),
	index("coa_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	index("coa_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const alipayAuthTokens = pgTable("alipay_auth_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	alipayUserId: varchar("alipay_user_id", { length: 64 }),
	accessToken: varchar("access_token", { length: 512 }),
	refreshToken: varchar("refresh_token", { length: 512 }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	refreshExpiresAt: timestamp("refresh_expires_at", { withTimezone: true, mode: 'string' }),
	authScopes: text("auth_scopes").array(),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_alipay_auth_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_alipay_auth_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_alipay_auth_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("uk_user_alipay_auth").on(table.userId),
]);

export const auxiliaryTypes = pgTable("auxiliary_types", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	isSystem: boolean("is_system").default(false).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("at_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("at_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const auxiliaryItems = pgTable("auxiliary_items", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	typeId: varchar("type_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	parentId: varchar("parent_id", { length: 36 }),
	fullCode: varchar("full_code", { length: 200 }),
	fullName: varchar("full_name", { length: 500 }),
	isLeaf: boolean("is_leaf").default(true).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("ai_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("ai_full_code_idx").using("btree", table.fullCode.asc().nullsLast().op("text_ops")),
	index("ai_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	index("ai_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ai_type_id_idx").using("btree", table.typeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [auxiliaryTypes.id],
			name: "fk_auxiliary_item_type"
		}).onDelete("cascade"),
]);

export const accountAuxiliarySettings = pgTable("account_auxiliary_settings", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	accountId: varchar("account_id", { length: 36 }).notNull(),
	auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(),
	isRequired: boolean("is_required").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aas_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("text_ops")),
	index("aas_auxiliary_type_id_idx").using("btree", table.auxiliaryTypeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.auxiliaryTypeId],
			foreignColumns: [auxiliaryTypes.id],
			name: "fk_aas_auxiliary_type"
		}).onDelete("cascade"),
	unique("uq_account_auxiliary").on(table.accountId, table.auxiliaryTypeId),
]);

export const piSettlementApplications = pgTable("pi_settlement_applications", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	applicationNo: varchar("application_no", { length: 50 }).notNull(),
	applicationDate: date("application_date"),
	enterpriseName: varchar("enterprise_name", { length: 255 }).notNull(),
	enterpriseNameBackup: varchar("enterprise_name_backup", { length: 255 }),
	registeredCapital: numeric("registered_capital", { precision: 12, scale:  2 }),
	currencyType: varchar("currency_type", { length: 20 }).default('CNY'),
	taxType: varchar("tax_type", { length: 20 }),
	expectedAnnualRevenue: numeric("expected_annual_revenue", { precision: 12, scale:  2 }),
	expectedAnnualTax: numeric("expected_annual_tax", { precision: 12, scale:  2 }),
	originalRegisteredAddress: varchar("original_registered_address", { length: 500 }),
	mailingAddress: varchar("mailing_address", { length: 500 }),
	businessAddress: varchar("business_address", { length: 500 }),
	assignedAddressId: varchar("assigned_address_id", { length: 36 }),
	assignedAddress: varchar("assigned_address", { length: 500 }),
	legalPersonName: varchar("legal_person_name", { length: 100 }),
	legalPersonPhone: varchar("legal_person_phone", { length: 20 }),
	legalPersonEmail: varchar("legal_person_email", { length: 100 }),
	legalPersonAddress: varchar("legal_person_address", { length: 500 }),
	shareholders: jsonb(),
	supervisorName: varchar("supervisor_name", { length: 100 }),
	supervisorPhone: varchar("supervisor_phone", { length: 20 }),
	financeManagerName: varchar("finance_manager_name", { length: 100 }),
	financeManagerPhone: varchar("finance_manager_phone", { length: 20 }),
	contactPersonName: varchar("contact_person_name", { length: 100 }),
	contactPersonPhone: varchar("contact_person_phone", { length: 20 }),
	ewtContactName: varchar("ewt_contact_name", { length: 100 }),
	ewtContactPhone: varchar("ewt_contact_phone", { length: 20 }),
	intermediaryDepartment: varchar("intermediary_department", { length: 100 }),
	intermediaryName: varchar("intermediary_name", { length: 100 }),
	intermediaryPhone: varchar("intermediary_phone", { length: 20 }),
	businessScope: text("business_scope"),
	applicationType: varchar("application_type", { length: 20 }).notNull(),
	settlementType: varchar("settlement_type", { length: 20 }),
	approvalStatus: varchar("approval_status", { length: 20 }).default('draft').notNull(),
	approvalOpinion: text("approval_opinion"),
	approvedBy: varchar("approved_by", { length: 36 }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	processId: varchar("process_id", { length: 36 }),
	attachments: jsonb(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	remarks: text(),
	createdBy: varchar("created_by", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	personnel: jsonb(),
	enterpriseNameBackups: jsonb("enterprise_name_backups").default([]),
}, (table) => [
	index("idx_ssa_application_no").using("btree", table.applicationNo.asc().nullsLast().op("text_ops")),
	index("idx_ssa_application_type").using("btree", table.applicationType.asc().nullsLast().op("text_ops")),
	index("idx_ssa_approval_status").using("btree", table.approvalStatus.asc().nullsLast().op("text_ops")),
	index("idx_ssa_assigned_address_id").using("btree", table.assignedAddressId.asc().nullsLast().op("text_ops")),
	index("idx_ssa_enterprise_id").using("btree", table.enterpriseId.asc().nullsLast().op("text_ops")),
	index("idx_ssa_enterprise_name").using("btree", table.enterpriseName.asc().nullsLast().op("text_ops")),
	index("idx_ssa_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const auxiliaryBalances = pgTable("auxiliary_balances", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	ledgerId: varchar("ledger_id", { length: 36 }).notNull(),
	accountId: varchar("account_id", { length: 36 }).notNull(),
	accountCode: varchar("account_code", { length: 20 }).notNull(),
	auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(),
	auxiliaryItemId: varchar("auxiliary_item_id", { length: 36 }).notNull(),
	auxiliaryItemCode: varchar("auxiliary_item_code", { length: 50 }).notNull(),
	auxiliaryItemName: varchar("auxiliary_item_name", { length: 200 }).notNull(),
	period: varchar({ length: 20 }).notNull(),
	beginningDebit: numeric("beginning_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	beginningCredit: numeric("beginning_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	currentDebit: numeric("current_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	currentCredit: numeric("current_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	endingDebit: numeric("ending_debit", { precision: 18, scale:  2 }).default('0').notNull(),
	endingCredit: numeric("ending_credit", { precision: 18, scale:  2 }).default('0').notNull(),
	direction: varchar({ length: 10 }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ab_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("text_ops")),
	index("ab_auxiliary_item_id_idx").using("btree", table.auxiliaryItemId.asc().nullsLast().op("text_ops")),
	index("ab_auxiliary_type_id_idx").using("btree", table.auxiliaryTypeId.asc().nullsLast().op("text_ops")),
	index("ab_ledger_id_idx").using("btree", table.ledgerId.asc().nullsLast().op("text_ops")),
	index("ab_period_idx").using("btree", table.period.asc().nullsLast().op("text_ops")),
	index("ab_unique_idx").using("btree", table.ledgerId.asc().nullsLast().op("text_ops"), table.accountId.asc().nullsLast().op("text_ops"), table.auxiliaryTypeId.asc().nullsLast().op("text_ops"), table.auxiliaryItemId.asc().nullsLast().op("text_ops"), table.period.asc().nullsLast().op("text_ops")),
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
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	symbol: varchar({ length: 10 }),
	exchangeRate: numeric("exchange_rate", { precision: 18, scale:  6 }).default('1').notNull(),
	isBase: boolean("is_base").default(false).notNull(),
	decimalPlaces: integer("decimal_places").default(2).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: integer("sort_order").default(0),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("currency_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("currency_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("currencies_code_key").on(table.code),
]);

export const piSettlementProcesses = pgTable("pi_settlement_processes", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	applicationId: varchar("application_id", { length: 36 }).notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	enterpriseName: varchar("enterprise_name", { length: 255 }),
	processType: varchar("process_type", { length: 20 }).notNull(),
	currentStage: varchar("current_stage", { length: 50 }),
	currentStageIndex: integer("current_stage_index").default(0),
	overallStatus: varchar("overall_status", { length: 20 }).default('pending').notNull(),
	stages: jsonb(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_ssp_application_id").using("btree", table.applicationId.asc().nullsLast().op("text_ops")),
	index("idx_ssp_current_stage").using("btree", table.currentStage.asc().nullsLast().op("text_ops")),
	index("idx_ssp_enterprise_id").using("btree", table.enterpriseId.asc().nullsLast().op("text_ops")),
	index("idx_ssp_overall_status").using("btree", table.overallStatus.asc().nullsLast().op("text_ops")),
	index("idx_ssp_process_type").using("btree", table.processType.asc().nullsLast().op("text_ops")),
]);

export const piRegisteredAddresses = pgTable("pi_registered_addresses", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
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
	area: numeric({ precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('available').notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	applicationId: varchar("application_id", { length: 36 }),
	assignedAt: timestamp("assigned_at", { mode: 'string' }),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_ra_address_code").using("btree", table.addressCode.asc().nullsLast().op("text_ops")),
	index("idx_ra_application_id").using("btree", table.applicationId.asc().nullsLast().op("text_ops")),
	index("idx_ra_enterprise_id").using("btree", table.enterpriseId.asc().nullsLast().op("text_ops")),
	index("idx_ra_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("pi_registered_addresses_address_code_key").on(table.addressCode),
]);

export const piContracts = pgTable("pi_contracts", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }).notNull(),
	applicationId: varchar("application_id", { length: 36 }),
	processId: varchar("process_id", { length: 36 }),
	contractNo: varchar("contract_no", { length: 50 }),
	contractName: varchar("contract_name", { length: 255 }),
	contractType: varchar("contract_type", { length: 20 }).notNull(),
	rentAmount: numeric("rent_amount", { precision: 12, scale:  2 }),
	depositAmount: numeric("deposit_amount", { precision: 12, scale:  2 }),
	taxCommitment: numeric("tax_commitment", { precision: 12, scale:  2 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	signedDate: date("signed_date"),
	status: varchar({ length: 20 }).default('draft').notNull(),
	contractFileUrl: text("contract_file_url"),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_con_application_id").using("btree", table.applicationId.asc().nullsLast().op("text_ops")),
	index("idx_con_contract_no").using("btree", table.contractNo.asc().nullsLast().op("text_ops")),
	index("idx_con_enterprise_id").using("btree", table.enterpriseId.asc().nullsLast().op("text_ops")),
	index("idx_con_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("pi_contracts_contract_no_key").on(table.contractNo),
]);

export const exchangeRateHistory = pgTable("exchange_rate_history", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	currencyId: varchar("currency_id", { length: 36 }).notNull(),
	currencyCode: varchar("currency_code", { length: 10 }).notNull(),
	rateDate: date("rate_date").notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 18, scale:  6 }).notNull(),
	source: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const bases = pgTable("bases", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text(),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("bases_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("bases_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const meters = pgTable("meters", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	baseId: varchar("base_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	electricityNumber: varchar("electricity_number", { length: 50 }),
	electricityType: varchar("electricity_type", { length: 20 }).default('base'),
	waterNumber: varchar("water_number", { length: 50 }),
	waterType: varchar("water_type", { length: 20 }).default('base'),
	heatingNumber: varchar("heating_number", { length: 50 }),
	heatingType: varchar("heating_type", { length: 20 }).default('base'),
	area: numeric({ precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("meters_base_id_idx").using("btree", table.baseId.asc().nullsLast().op("text_ops")),
	index("meters_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.baseId],
			foreignColumns: [bases.id],
			name: "meters_base_id_fkey"
		}).onDelete("cascade"),
]);

export const spaces = pgTable("spaces", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	meterId: varchar("meter_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	area: numeric({ precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("spaces_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("spaces_meter_id_idx").using("btree", table.meterId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.meterId],
			foreignColumns: [meters.id],
			name: "spaces_meter_id_fkey"
		}).onDelete("cascade"),
]);

export const regNumbers = pgTable("reg_numbers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	spaceId: varchar("space_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('available').notNull(),
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("reg_numbers_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("reg_numbers_space_id_idx").using("btree", table.spaceId.asc().nullsLast().op("text_ops")),
	index("reg_numbers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [spaces.id],
			name: "reg_numbers_space_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.enterpriseId],
			foreignColumns: [enterprises.id],
			name: "reg_numbers_enterprise_id_fkey"
		}).onDelete("set null"),
]);

export const enterprises = pgTable("enterprises", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	creditCode: varchar("credit_code", { length: 50 }),
	legalPerson: varchar("legal_person", { length: 100 }),
	phone: varchar({ length: 20 }),
	industry: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	type: varchar({ length: 20 }).default('tenant').notNull(),
	registeredAddress: varchar("registered_address", { length: 500 }),
	businessAddress: varchar("business_address", { length: 500 }),
	settledDate: timestamp("settled_date", { mode: 'string' }),
	remarks: text(),
}, (table) => [
	index("enterprises_credit_code_idx").using("btree", table.creditCode.asc().nullsLast().op("text_ops")),
	index("enterprises_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("enterprises_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);
