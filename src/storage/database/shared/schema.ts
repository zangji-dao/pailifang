import { pgTable, index, varchar, text, timestamp, serial, integer, jsonb, boolean, unique, uuid, foreignKey, numeric, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customerFollows = pgTable("customer_follows", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
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

export const exchangeRateHistory = pgTable("exchange_rate_history", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	currencyId: varchar("currency_id", { length: 36 }).notNull(),
	currencyCode: varchar("currency_code", { length: 10 }).notNull(),
	rateDate: date("rate_date").notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 18, scale:  6 }).notNull(),
	source: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});


// ==================== 基地管理相关表 ====================

// 基地表
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

// 企业表
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
}, (table) => [
	index("enterprises_credit_code_idx").using("btree", table.creditCode.asc().nullsLast().op("text_ops")),
	index("enterprises_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

// 物业表（独立水电计量单元）
export const meters = pgTable("meters", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
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
	area: numeric("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("meters_base_id_idx").using("btree", table.baseId.asc().nullsLast().op("text_ops")),
	index("meters_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.baseId],
			foreignColumns: [bases.id],
			name: "fk_meters_base"
		}).onDelete("cascade"),
]);

// 物理空间表
export const spaces = pgTable("spaces", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	meterId: varchar("meter_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	area: numeric("area", { precision: 10, scale: 2 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("spaces_meter_id_idx").using("btree", table.meterId.asc().nullsLast().op("text_ops")),
	index("spaces_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.meterId],
			foreignColumns: [meters.id],
			name: "fk_spaces_meter"
		}).onDelete("cascade"),
]);

// 注册号表
export const regNumbers = pgTable("reg_numbers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	spaceId: varchar("space_id", { length: 36 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('available').notNull(), // available=可用, allocated=已分配, reserved=预留
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
			name: "fk_reg_numbers_space"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.enterpriseId],
			foreignColumns: [enterprises.id],
			name: "fk_reg_numbers_enterprise"
		}).onDelete("set null"),
]);
