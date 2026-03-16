import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  serial,
  decimal,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import {
  chartOfAccounts,
  vouchers,
  voucherEntries,
  accountBalances,
} from "./accountingSchema";

// ==================== 用户表 ====================
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("accountant"), // admin, accountant, sales
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// ==================== 客户表 ====================
export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    contactPerson: varchar("contact_person", { length: 128 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    salesId: varchar("sales_id", { length: 36 }),
    status: varchar("status", { length: 20 }).notNull().default("potential"), // potential, cooperative, lost
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("customers_name_idx").on(table.name),
    index("customers_sales_id_idx").on(table.salesId),
    index("customers_status_idx").on(table.status),
  ]
);

// ==================== 账套表 ====================
export const ledgers = pgTable(
  "ledgers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    customerId: varchar("customer_id", { length: 36 }).notNull(),
    accountantId: varchar("accountant_id", { length: 36 }).notNull(),
    year: integer("year").notNull(),
    // 会计准则设置
    accountingStandard: varchar("accounting_standard", { length: 50 }).notNull().default("small_enterprise"),
    taxpayerType: varchar("taxpayer_type", { length: 20 }).notNull().default("small"), // general, small
    startMonth: integer("start_month").notNull().default(1), // 启用期间（1-12月）
    // 精度设置
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("CNY"), // 本位币
    amountDecimal: integer("amount_decimal").notNull().default(2), // 金额小数位数 (2-4)
    quantityDecimal: integer("quantity_decimal").notNull().default(2), // 数量小数位数 (2-4)
    priceDecimal: integer("price_decimal").notNull().default(2), // 单价小数位数 (2-6)
    // 状态
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, closed, archived
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("ledgers_customer_id_idx").on(table.customerId),
    index("ledgers_accountant_id_idx").on(table.accountantId),
    index("ledgers_year_idx").on(table.year),
    index("ledgers_status_idx").on(table.status),
  ]
);

// ==================== 工单表 ====================
export const workOrders = pgTable(
  "work_orders",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // tax_declaration, bookkeeping, audit, etc.
    description: text("description"),
    customerId: varchar("customer_id", { length: 36 }),
    ledgerId: varchar("ledger_id", { length: 36 }),
    assignedTo: varchar("assigned_to", { length: 36 }).notNull(),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, completed, cancelled
    dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("work_orders_customer_id_idx").on(table.customerId),
    index("work_orders_ledger_id_idx").on(table.ledgerId),
    index("work_orders_assigned_to_idx").on(table.assignedTo),
    index("work_orders_status_idx").on(table.status),
    index("work_orders_priority_idx").on(table.priority),
  ]
);

// ==================== 分润规则表 ====================
export const profitRules = pgTable(
  "profit_rules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // fixed_rate, tiered, custom
    salesRate: integer("sales_rate").notNull(), // 销售提成率（千分比，如 300 表示 30%）
    accountantRate: integer("accountant_rate").notNull(), // 会计提成率
    baseAmount: integer("base_amount").default(0), // 基础金额（分）
    conditions: jsonb("conditions"), // 分层条件等
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("profit_rules_type_idx").on(table.type),
    index("profit_rules_is_active_idx").on(table.isActive),
  ]
);

// ==================== 分润记录表 ====================
export const profitShares = pgTable(
  "profit_shares",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerId: varchar("customer_id", { length: 36 }),
    ledgerId: varchar("ledger_id", { length: 36 }),
    salesId: varchar("sales_id", { length: 36 }),
    accountantId: varchar("accountant_id", { length: 36 }),
    profitRuleId: varchar("profit_rule_id", { length: 36 }).notNull(),
    totalAmount: integer("total_amount").notNull(), // 总金额（分）
    salesAmount: integer("sales_amount").notNull(), // 销售分成金额（分）
    accountantAmount: integer("accountant_amount").notNull(), // 会计分成金额（分）
    period: varchar("period", { length: 20 }).notNull(), // 结算周期（如 2024-01）
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, paid
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("profit_shares_customer_id_idx").on(table.customerId),
    index("profit_shares_sales_id_idx").on(table.salesId),
    index("profit_shares_accountant_id_idx").on(table.accountantId),
    index("profit_shares_period_idx").on(table.period),
    index("profit_shares_status_idx").on(table.status),
  ]
);

// ==================== 客户跟进记录表 ====================
export const customerFollows = pgTable(
  "customer_follows",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerId: varchar("customer_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // call, visit, email, message
    content: text("content"),
    nextFollowDate: timestamp("next_follow_date", { withTimezone: true, mode: "string" }),
    status: varchar("status", { length: 20 }).default("completed"), // completed, pending
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("customer_follows_customer_id_idx").on(table.customerId),
    index("customer_follows_user_id_idx").on(table.userId),
    index("customer_follows_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 系统表（保留）====================
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ==================== TypeScript Types ====================
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Ledger = typeof ledgers.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type ProfitRule = typeof profitRules.$inferSelect;
export type ProfitShare = typeof profitShares.$inferSelect;
export type CustomerFollow = typeof customerFollows.$inferSelect;
