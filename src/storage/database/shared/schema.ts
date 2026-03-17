import { mysqlTable, varchar, text, datetime, int, json, boolean, unique, foreignKey, decimal, date, index, serial } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"



export const customerFollows = mysqlTable("customer_follows", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	content: text(),
	nextFollowDate: datetime("next_follow_date"),
	status: varchar({ length: 20 }).default('completed'),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("customer_follows_created_at_idx").on(table.createdAt),
	index("customer_follows_customer_id_idx").on(table.customerId),
	index("customer_follows_user_id_idx").on(table.userId),
]);

export const healthCheck = mysqlTable("health_check", {
	id: serial().primaryKey().notNull(),
	updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const customers = mysqlTable("customers", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 128 }).notNull(),
	contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	address: text(),
	salesId: varchar("sales_id", { length: 36 }),
	status: varchar({ length: 20 }).default('potential').notNull(),
	notes: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("customers_name_idx").on(table.name),
	index("customers_sales_id_idx").on(table.salesId),
	index("customers_status_idx").on(table.status),
]);

export const ledgers = mysqlTable("ledgers", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	accountantId: varchar("accountant_id", { length: 36 }).notNull(),
	year: int().notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	description: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("ledgers_accountant_id_idx").on(table.accountantId),
	index("ledgers_customer_id_idx").on(table.customerId),
	index("ledgers_status_idx").on(table.status),
	index("ledgers_year_idx").on(table.year),
]);

export const profitRules = mysqlTable("profit_rules", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	salesRate: int("sales_rate").notNull(),
	accountantRate: int("accountant_rate").notNull(),
	baseAmount: int("base_amount").default(0),
	conditions: json(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("profit_rules_is_active_idx").on(table.isActive),
	index("profit_rules_type_idx").on(table.type),
]);

export const profitShares = mysqlTable("profit_shares", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	customerId: varchar("customer_id", { length: 36 }),
	ledgerId: varchar("ledger_id", { length: 36 }),
	salesId: varchar("sales_id", { length: 36 }),
	accountantId: varchar("accountant_id", { length: 36 }),
	profitRuleId: varchar("profit_rule_id", { length: 36 }).notNull(),
	totalAmount: int("total_amount").notNull(),
	salesAmount: int("sales_amount").notNull(),
	accountantAmount: int("accountant_amount").notNull(),
	period: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	paidAt: datetime("paid_at"),
	notes: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("profit_shares_accountant_id_idx").on(table.accountantId),
	index("profit_shares_customer_id_idx").on(table.customerId),
	index("profit_shares_period_idx").on(table.period),
	index("profit_shares_sales_id_idx").on(table.salesId),
	index("profit_shares_status_idx").on(table.status),
]);

export const users = mysqlTable("users", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	role: varchar({ length: 20 }).default('accountant').notNull(),
	phone: varchar({ length: 20 }),
	avatar: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: json(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("users_email_idx").on(table.email),
	index("users_role_idx").on(table.role),
	unique("users_email_unique").on(table.email),
]);

export const workOrders = mysqlTable("work_orders", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	customerId: varchar("customer_id", { length: 36 }),
	ledgerId: varchar("ledger_id", { length: 36 }),
	assignedTo: varchar("assigned_to", { length: 36 }).notNull(),
	createdBy: varchar("created_by", { length: 36 }).notNull(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	dueDate: datetime("due_date"),
	completedAt: datetime("completed_at"),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("work_orders_assigned_to_idx").on(table.assignedTo),
	index("work_orders_customer_id_idx").on(table.customerId),
	index("work_orders_ledger_id_idx").on(table.ledgerId),
	index("work_orders_priority_idx").on(table.priority),
	index("work_orders_status_idx").on(table.status),
]);

export const chartOfAccounts = mysqlTable("chart_of_accounts", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	ledgerId: varchar("ledger_id", { length: 36 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	parentId: varchar("parent_id", { length: 36 }),
	level: int().default(1).notNull(),
	type: varchar({ length: 20 }).notNull(),
	direction: varchar({ length: 10 }).notNull(),
	isLeaf: boolean("is_leaf").default(true).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	remark: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("coa_code_idx").on(table.code),
	index("coa_ledger_id_idx").on(table.ledgerId),
	index("coa_level_idx").on(table.level),
	index("coa_parent_id_idx").on(table.parentId),
	index("coa_type_idx").on(table.type),
]);

export const auxiliaryTypes = mysqlTable("auxiliary_types", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	isSystem: boolean("is_system").default(false).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: int("sort_order").default(0),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("at_code_idx").on(table.code),
	index("at_status_idx").on(table.status),
]);

export const auxiliaryItems = mysqlTable("auxiliary_items", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	typeId: varchar("type_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	parentId: varchar("parent_id", { length: 36 }),
	fullCode: varchar("full_code", { length: 200 }),
	fullName: varchar("full_name", { length: 500 }),
	isLeaf: boolean("is_leaf").default(true).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	remark: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
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

export const accountAuxiliarySettings = mysqlTable("account_auxiliary_settings", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	accountId: varchar("account_id", { length: 36 }).notNull(),
	auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(),
	isRequired: boolean("is_required").default(false).notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

export const auxiliaryBalances = mysqlTable("auxiliary_balances", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
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
	updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

export const currencies = mysqlTable("currencies", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	symbol: varchar({ length: 10 }),
	exchangeRate: decimal("exchange_rate", { precision: 18, scale:  6 }).default('1').notNull(),
	isBase: boolean("is_base").default(false).notNull(),
	decimalPlaces: int("decimal_places").default(2).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	sortOrder: int("sort_order").default(0),
	remark: text(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("currency_code_idx").on(table.code),
	index("currency_status_idx").on(table.status),
	unique("currencies_code_key").on(table.code),
]);

export const exchangeRateHistory = mysqlTable("exchange_rate_history", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	currencyId: varchar("currency_id", { length: 36 }).notNull(),
	currencyCode: varchar("currency_code", { length: 10 }).notNull(),
	rateDate: date("rate_date").notNull(),
	exchangeRate: decimal("exchange_rate", { precision: 18, scale:  6 }).notNull(),
	source: varchar({ length: 50 }),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});


// ==================== 基地管理相关表 ====================

// 基地表
export const bases = mysqlTable("bases", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text(),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("bases_name_idx").on(table.name),
	index("bases_status_idx").on(table.status),
]);

// 企业表
export const enterprises = mysqlTable("enterprises", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	creditCode: varchar("credit_code", { length: 50 }),
	legalPerson: varchar("legal_person", { length: 100 }),
	phone: varchar({ length: 20 }),
	industry: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("enterprises_credit_code_idx").on(table.creditCode),
	index("enterprises_name_idx").on(table.name),
]);

// 物业表（独立水电计量单元）
export const meters = mysqlTable("meters", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	baseId: varchar("base_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	// 电表
	electricityNumber: varchar("electricity_number", { length: 50 }),
	electricityType: varchar("electricity_type", { length: 20 }).default('base'), // base=基地负责, customer=客户负责
	// 水表
	waterNumber: varchar("water_number", { length: 50 }),
	waterType: varchar("water_type", { length: 20 }).default('base'),
	// 取暖
	heatingNumber: varchar("heating_number", { length: 50 }),
	heatingType: varchar("heating_type", { length: 20 }).default('base'),
	// 面积
	area: decimal("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("meters_base_id_idx").on(table.baseId),
	index("meters_code_idx").on(table.code),
	foreignKey({
			columns: [table.baseId],
			foreignColumns: [bases.id],
			name: "fk_meters_base"
		}).onDelete("cascade"),
]);

// 物理空间表
export const spaces = mysqlTable("spaces", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	meterId: varchar("meter_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	area: decimal("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
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
export const regNumbers = mysqlTable("reg_numbers", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	spaceId: varchar("space_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('available').notNull(), // available=可用, allocated=已分配, reserved=预留
	enterpriseId: varchar("enterprise_id", { length: 36 }),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
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
export const alipayAuthTokens = mysqlTable("alipay_auth_tokens", {
	id: varchar({ length: 36 }).default(sql`(UUID())`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	alipayUserId: varchar("alipay_user_id", { length: 64 }).notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresIn: int("expires_in").notNull(),
	reExpiresIn: int("re_expires_in").notNull(),
	tokenType: varchar("token_type", { length: 20 }).default('Bearer'),
	authTime: datetime("auth_time").notNull(),
	expiresAt: datetime("expires_at").notNull(),
	refreshExpiresAt: datetime("refresh_expires_at").notNull(),
	createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: datetime("updated_at"),
}, (table) => [
	index("alipay_auth_tokens_user_id_idx").on(table.userId),
	index("alipay_auth_tokens_alipay_user_id_idx").on(table.alipayUserId),
]);
