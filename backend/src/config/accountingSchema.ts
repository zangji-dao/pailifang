import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ==================== 辅助核算类型枚举 ====================
// 客户核算、供应商核算、部门核算、项目核算、个人核算、存货核算、自定义核算

// ==================== 辅助核算类型表 ====================
export const auxiliaryTypes = pgTable(
  "auxiliary_types",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 所属账套
    code: varchar("code", { length: 20 }).notNull(), // 类型编码
    name: varchar("name", { length: 50 }).notNull(), // 类型名称（客户、供应商、部门、项目等）
    category: varchar("category", { length: 20 }).notNull(), // 分类：customer, supplier, department, project, person, inventory, custom
    isSystem: boolean("is_system").notNull().default(false), // 是否系统预设
    isActive: boolean("is_active").notNull().default(true), // 是否启用
    sortOrder: integer("sort_order").default(0), // 排序
    remark: text("remark"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("at_ledger_id_idx").on(table.ledgerId),
    index("at_code_idx").on(table.code),
    index("at_category_idx").on(table.category),
  ]
);

// ==================== 辅助核算档案表 ====================
// 存储具体的辅助核算项目：客户A、部门B、项目C等
export const auxiliaryItems = pgTable(
  "auxiliary_items",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 所属账套
    typeId: varchar("type_id", { length: 36 }).notNull(), // 辅助核算类型ID
    code: varchar("code", { length: 50 }).notNull(), // 项目编码
    name: varchar("name", { length: 200 }).notNull(), // 项目名称
    parentId: varchar("parent_id", { length: 36 }), // 上级项目ID（用于树形结构）
    level: integer("level").notNull().default(1), // 层级
    isLeaf: boolean("is_leaf").notNull().default(true), // 是否叶子节点
    isActive: boolean("is_active").notNull().default(true), // 是否启用
    // 扩展属性（JSON格式，存储不同类型特有的属性）
    extraAttrs: jsonb("extra_attrs").$type<Record<string, unknown>>(),
    // 例如：
    // 客户：{ contact: "联系人", phone: "电话", address: "地址", creditLimit: "信用额度" }
    // 供应商：{ contact: "联系人", phone: "电话", bankAccount: "银行账号" }
    // 部门：{ manager: "负责人", costCenter: "成本中心" }
    // 项目：{ startDate: "开始日期", endDate: "结束日期", budget: "预算" }
    remark: text("remark"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("ai_ledger_id_idx").on(table.ledgerId),
    index("ai_type_id_idx").on(table.typeId),
    index("ai_code_idx").on(table.code),
    index("ai_parent_id_idx").on(table.parentId),
  ]
);

// ==================== 科目辅助核算设置表 ====================
// 记录每个科目启用了哪些辅助核算类型
export const accountAuxiliarySettings = pgTable(
  "account_auxiliary_settings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: varchar("account_id", { length: 36 }).notNull(), // 科目ID
    accountCode: varchar("account_code", { length: 20 }).notNull(), // 科目编码（冗余）
    auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(), // 辅助核算类型ID
    isRequired: boolean("is_required").notNull().default(true), // 是否必填
    sortOrder: integer("sort_order").default(0), // 排序（多辅助核算时的显示顺序）
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("aas_account_id_idx").on(table.accountId),
    index("aas_auxiliary_type_id_idx").on(table.auxiliaryTypeId),
    index("aas_unique_idx").on(table.accountId, table.auxiliaryTypeId),
  ]
);

// ==================== 会计科目表 ====================
export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 所属账套
    code: varchar("code", { length: 20 }).notNull(), // 科目编码
    name: varchar("name", { length: 100 }).notNull(), // 科目名称
    parentId: varchar("parent_id", { length: 36 }), // 上级科目ID
    level: integer("level").notNull().default(1), // 科目层级（1-6）
    type: varchar("type", { length: 20 }).notNull(), // 科目类型：asset, liability, equity, income, expense
    direction: varchar("direction", { length: 10 }).notNull(), // 方向：debit(借), credit(贷)
    isLeaf: boolean("is_leaf").notNull().default(true), // 是否为叶子节点
    isActive: boolean("is_active").notNull().default(true), // 是否启用
    remark: text("remark"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("coa_ledger_id_idx").on(table.ledgerId),
    index("coa_code_idx").on(table.code),
    index("coa_parent_id_idx").on(table.parentId),
    index("coa_type_idx").on(table.type),
    index("coa_level_idx").on(table.level),
  ]
);

// ==================== 凭证表 ====================
export const vouchers = pgTable(
  "vouchers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 所属账套
    voucherNo: varchar("voucher_no", { length: 50 }).notNull(), // 凭证号
    voucherDate: timestamp("voucher_date", { withTimezone: true, mode: "string" })
      .notNull(), // 凭证日期
    period: varchar("period", { length: 20 }).notNull(), // 会计期间（2024-01）
    summary: text("summary"), // 摘要
    debitAmount: decimal("debit_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 借方金额合计
    creditAmount: decimal("credit_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 贷方金额合计
    attachmentCount: integer("attachment_count").default(0), // 附件数
    status: varchar("status", { length: 20 }).notNull().default("draft"), // 状态：draft(草稿), submitted(已提交), reviewed(已审核), posted(已过账)
    createdBy: varchar("created_by", { length: 36 }).notNull(), // 制单人
    reviewedBy: varchar("reviewed_by", { length: 36 }), // 审核人
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }), // 审核时间
    postedBy: varchar("posted_by", { length: 36 }), // 过账人
    postedAt: timestamp("posted_at", { withTimezone: true, mode: "string" }), // 过账时间
    remark: text("remark"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("vouchers_ledger_id_idx").on(table.ledgerId),
    index("vouchers_period_idx").on(table.period),
    index("vouchers_voucher_no_idx").on(table.voucherNo),
    index("vouchers_status_idx").on(table.status),
    index("vouchers_voucher_date_idx").on(table.voucherDate),
  ]
);

// ==================== 凭证分录表 ====================
export const voucherEntries = pgTable(
  "voucher_entries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    voucherId: varchar("voucher_id", { length: 36 }).notNull(), // 凭证ID
    accountId: varchar("account_id", { length: 36 }).notNull(), // 科目ID
    accountCode: varchar("account_code", { length: 20 }).notNull(), // 科目编码（冗余，方便查询）
    accountName: varchar("account_name", { length: 100 }).notNull(), // 科目名称（冗余）
    summary: text("summary"), // 摘要
    debitAmount: decimal("debit_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 借方金额
    creditAmount: decimal("credit_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 贷方金额
    lineNo: integer("line_no").notNull(), // 行号
    // 数量核算字段
    quantity: decimal("quantity", { precision: 18, scale: 4 }), // 数量
    unitPrice: decimal("unit_price", { precision: 18, scale: 4 }), // 单价
    unit: varchar("unit", { length: 20 }), // 单位
    // 外币核算字段
    currency: varchar("currency", { length: 10 }), // 币种
    originalAmount: decimal("original_amount", { precision: 18, scale: 2 }), // 原币金额
    exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }), // 汇率
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("ve_voucher_id_idx").on(table.voucherId),
    index("ve_account_id_idx").on(table.accountId),
    index("ve_account_code_idx").on(table.accountCode),
  ]
);

// ==================== 凭证分录辅助核算明细表 ====================
// 记录凭证分录的辅助核算信息
export const voucherEntryAuxiliaries = pgTable(
  "voucher_entry_auxiliaries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    entryId: varchar("entry_id", { length: 36 }).notNull(), // 凭证分录ID
    auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(), // 辅助核算类型ID
    auxiliaryTypeName: varchar("auxiliary_type_name", { length: 50 }).notNull(), // 类型名称（冗余）
    auxiliaryItemId: varchar("auxiliary_item_id", { length: 36 }).notNull(), // 辅助核算项目ID
    auxiliaryItemCode: varchar("auxiliary_item_code", { length: 50 }).notNull(), // 项目编码（冗余）
    auxiliaryItemName: varchar("auxiliary_item_name", { length: 200 }).notNull(), // 项目名称（冗余）
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vea_entry_id_idx").on(table.entryId),
    index("vea_auxiliary_type_id_idx").on(table.auxiliaryTypeId),
    index("vea_auxiliary_item_id_idx").on(table.auxiliaryItemId),
  ]
);

// ==================== 辅助核算余额表 ====================
// 按辅助核算维度统计余额
export const auxiliaryBalances = pgTable(
  "auxiliary_balances",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 账套ID
    accountId: varchar("account_id", { length: 36 }).notNull(), // 科目ID
    accountCode: varchar("account_code", { length: 20 }).notNull(), // 科目编码
    auxiliaryTypeId: varchar("auxiliary_type_id", { length: 36 }).notNull(), // 辅助核算类型ID
    auxiliaryItemId: varchar("auxiliary_item_id", { length: 36 }).notNull(), // 辅助核算项目ID
    auxiliaryItemCode: varchar("auxiliary_item_code", { length: 50 }).notNull(), // 项目编码
    auxiliaryItemName: varchar("auxiliary_item_name", { length: 200 }).notNull(), // 项目名称
    period: varchar("period", { length: 20 }).notNull(), // 会计期间
    beginningDebit: decimal("beginning_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期初借方余额
    beginningCredit: decimal("beginning_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期初贷方余额
    currentDebit: decimal("current_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 本期借方发生额
    currentCredit: decimal("current_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 本期贷方发生额
    endingDebit: decimal("ending_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期末借方余额
    endingCredit: decimal("ending_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期末贷方余额
    direction: varchar("direction", { length: 10 }).notNull(), // 余额方向
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ab_ledger_id_idx").on(table.ledgerId),
    index("ab_account_id_idx").on(table.accountId),
    index("ab_auxiliary_type_id_idx").on(table.auxiliaryTypeId),
    index("ab_auxiliary_item_id_idx").on(table.auxiliaryItemId),
    index("ab_period_idx").on(table.period),
    index("ab_unique_idx").on(table.ledgerId, table.accountId, table.auxiliaryTypeId, table.auxiliaryItemId, table.period),
  ]
);

// ==================== 科目余额表 ====================
export const accountBalances = pgTable(
  "account_balances",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ledgerId: varchar("ledger_id", { length: 36 }).notNull(), // 账套ID
    accountId: varchar("account_id", { length: 36 }).notNull(), // 科目ID
    accountCode: varchar("account_code", { length: 20 }).notNull(), // 科目编码
    accountName: varchar("account_name", { length: 100 }).notNull(), // 科目名称
    period: varchar("period", { length: 20 }).notNull(), // 会计期间
    beginningDebit: decimal("beginning_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期初借方余额
    beginningCredit: decimal("beginning_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期初贷方余额
    currentDebit: decimal("current_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 本期借方发生额
    currentCredit: decimal("current_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 本期贷方发生额
    endingDebit: decimal("ending_debit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期末借方余额
    endingCredit: decimal("ending_credit", { precision: 18, scale: 2 })
      .notNull()
      .default("0"), // 期末贷方余额
    direction: varchar("direction", { length: 10 }).notNull(), // 余额方向
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ab_ledger_id_idx").on(table.ledgerId),
    index("ab_account_id_idx").on(table.accountId),
    index("ab_period_idx").on(table.period),
    index("ab_account_code_idx").on(table.accountCode),
    index("ab_unique_idx").on(table.ledgerId, table.accountId, table.period),
  ]
);

// ==================== TypeScript Types ====================
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type AuxiliaryType = typeof auxiliaryTypes.$inferSelect;
export type AuxiliaryItem = typeof auxiliaryItems.$inferSelect;
export type AccountAuxiliarySetting = typeof accountAuxiliarySettings.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type VoucherEntry = typeof voucherEntries.$inferSelect;
export type VoucherEntryAuxiliary = typeof voucherEntryAuxiliaries.$inferSelect;
export type AuxiliaryBalance = typeof auxiliaryBalances.$inferSelect;
export type AccountBalance = typeof accountBalances.$inferSelect;

// ==================== Zod Schemas ====================
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertChartOfAccountSchema = createCoercedInsertSchema(chartOfAccounts).pick({
  ledgerId: true,
  code: true,
  name: true,
  parentId: true,
  level: true,
  type: true,
  direction: true,
  isLeaf: true,
  isActive: true,
  remark: true,
});

export const insertVoucherSchema = createCoercedInsertSchema(vouchers).pick({
  ledgerId: true,
  voucherNo: true,
  voucherDate: true,
  period: true,
  summary: true,
  attachmentCount: true,
  status: true,
  createdBy: true,
  remark: true,
});

export const insertVoucherEntrySchema = createCoercedInsertSchema(voucherEntries).pick({
  voucherId: true,
  accountId: true,
  accountCode: true,
  accountName: true,
  summary: true,
  debitAmount: true,
  creditAmount: true,
  lineNo: true,
});

export const insertAccountBalanceSchema = createCoercedInsertSchema(accountBalances).pick({
  ledgerId: true,
  accountId: true,
  accountCode: true,
  accountName: true,
  period: true,
  beginningDebit: true,
  beginningCredit: true,
  currentDebit: true,
  currentCredit: true,
  endingDebit: true,
  endingCredit: true,
  direction: true,
});
