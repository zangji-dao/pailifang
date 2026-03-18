/**
 * 数据库客户端
 * 使用 Drizzle ORM + MySQL
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './shared/schema';
import { eq, and, or, desc, asc, sql, inArray, isNull, isNotNull, like, gte, lte, gt, lt, SQL } from 'drizzle-orm';

let pool: mysql.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;

function getMySQLConfig() {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv').config();
    } catch {}
  }

  return {
    host: process.env.MYSQL_HOST || process.env.COZE_MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.COZE_MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || process.env.COZE_MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.COZE_MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.COZE_MYSQL_DATABASE || 'pi_cube',
  };
}

function getPool(): mysql.Pool {
  if (!pool) {
    const config = getMySQLConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

function getDb(): any {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema, mode: 'default' });
  }
  return dbInstance;
}

// 表名映射
const tables: Record<string, any> = {
  users: schema.users,
  customers: schema.customers,
  customer_follows: schema.customerFollows,
  ledgers: schema.ledgers,
  chart_of_accounts: schema.chartOfAccounts,
  auxiliary_types: schema.auxiliaryTypes,
  auxiliary_items: schema.auxiliaryItems,
  account_auxiliary_settings: schema.accountAuxiliarySettings,
  auxiliary_balances: schema.auxiliaryBalances,
  currencies: schema.currencies,
  exchange_rate_history: schema.exchangeRateHistory,
  profit_rules: schema.profitRules,
  profit_shares: schema.profitShares,
  work_orders: schema.workOrders,
  health_check: schema.healthCheck,
  bases: schema.bases,
  enterprises: schema.enterprises,
  meters: schema.meters,
  spaces: schema.spaces,
  reg_numbers: schema.regNumbers,
  alipay_auth_tokens: schema.alipayAuthTokens,
};

// 查询构建器 - 完全兼容 Supabase API
class QueryBuilder {
  private table: any;
  private db: ReturnType<typeof getDb>;
  private wheres: SQL[] = [];
  private orders: SQL[] = [];
  private limitNum?: number;
  private offsetNum?: number;
  private fields: any = undefined;
  private countRequested = false;
  private headOnly = false;

  constructor(tableName: string) {
    this.table = tables[tableName];
    this.db = getDb();
    if (!this.table) {
      throw new Error(`Table ${tableName} not found`);
    }
  }

  select(fields?: string | string[], options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): this {
    // 支持 select("*") 或 select(["col1", "col2"])
    if (fields === '*' || fields === undefined || (Array.isArray(fields) && fields.length === 0)) {
      // 选择所有字段
      this.fields = undefined;
    } else if (typeof fields === 'string') {
      // 单个字符串字段
      this.fields = { [fields]: this.table[fields] };
    } else if (Array.isArray(fields)) {
      this.fields = {};
      for (const f of fields) {
        this.fields[f] = this.table[f];
      }
    }
    
    // 处理选项
    if (options) {
      if (options.count) {
        this.countRequested = true;
      }
      if (options.head) {
        this.headOnly = true;
      }
    }
    
    return this;
  }

  eq(column: string, value: any): this {
    this.wheres.push(eq(this.table[column], value));
    return this;
  }

  neq(column: string, value: any): this {
    this.wheres.push(sql`${this.table[column]} != ${value}`);
    return this;
  }

  gt(column: string, value: any): this {
    this.wheres.push(gt(this.table[column], value));
    return this;
  }

  gte(column: string, value: any): this {
    this.wheres.push(gte(this.table[column], value));
    return this;
  }

  lt(column: string, value: any): this {
    this.wheres.push(lt(this.table[column], value));
    return this;
  }

  lte(column: string, value: any): this {
    this.wheres.push(lte(this.table[column], value));
    return this;
  }

  like(column: string, pattern: string): this {
    this.wheres.push(like(this.table[column], pattern));
    return this;
  }

  ilike(column: string, pattern: string): this {
    // MySQL 使用 LIKE 默认不区分大小写
    this.wheres.push(like(this.table[column], pattern));
    return this;
  }

  in(column: string, values: any[]): this {
    this.wheres.push(inArray(this.table[column], values));
    return this;
  }

  is(column: string, value: any): this {
    // 处理 null 值
    if (value === null) {
      this.wheres.push(isNull(this.table[column]));
    } else {
      this.wheres.push(eq(this.table[column], value));
    }
    return this;
  }

  or(queryString: string): this {
    // 解析 Supabase 风格的 or 查询: "code.ilike.%search%,name.ilike.%search%"
    const conditions: SQL[] = [];
    const parts = queryString.split(',');
    
    for (const part of parts) {
      const match = part.match(/^(\w+)\.(ilike|like|eq|neq|gt|gte|lt|lte)\.(.+)$/);
      if (match) {
        const [, col, op, val] = match;
        // 移除值两端的通配符标记（如果有）
        const cleanVal = val.startsWith('%') && val.endsWith('%') 
          ? val.slice(1, -1) 
          : val;
        
        switch (op) {
          case 'ilike':
          case 'like':
            conditions.push(like(this.table[col], `%${cleanVal}%`));
            break;
          case 'eq':
            conditions.push(eq(this.table[col], cleanVal));
            break;
          case 'neq':
            conditions.push(sql`${this.table[col]} != ${cleanVal}`);
            break;
          case 'gt':
            conditions.push(gt(this.table[col], cleanVal));
            break;
          case 'gte':
            conditions.push(gte(this.table[col], cleanVal));
            break;
          case 'lt':
            conditions.push(lt(this.table[col], cleanVal));
            break;
          case 'lte':
            conditions.push(lte(this.table[col], cleanVal));
            break;
        }
      }
    }
    
    if (conditions.length > 0) {
      this.wheres.push(or(...conditions)!);
    }
    return this;
  }

  isNull(column: string): this {
    this.wheres.push(isNull(this.table[column]));
    return this;
  }

  isNotNull(column: string): this {
    this.wheres.push(isNotNull(this.table[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean } | 'asc' | 'desc'): this {
    let direction: 'asc' | 'desc' = 'asc';
    if (typeof options === 'string') {
      direction = options;
    } else if (options && typeof options === 'object') {
      direction = options.ascending === false ? 'desc' : 'asc';
    }
    this.orders.push(direction === 'asc' ? asc(this.table[column]) : desc(this.table[column]));
    return this;
  }

  limit(n: number): this {
    this.limitNum = n;
    return this;
  }

  offset(n: number): this {
    this.offsetNum = n;
    return this;
  }

  range(from: number, to: number): this {
    // Supabase 风格的范围查询：range(from, to) 表示从 from 到 to 的记录
    // 相当于 limit(to - from + 1).offset(from)
    this.limitNum = to - from + 1;
    this.offsetNum = from;
    return this;
  }

  private buildQuery() {
    let query = this.db.select(this.fields).from(this.table);
    
    if (this.wheres.length > 0) {
      query = query.where(and(...this.wheres)) as any;
    }
    
    for (const o of this.orders) {
      query = (query as any).orderBy(o);
    }
    
    if (this.limitNum !== undefined) {
      query = (query as any).limit(this.limitNum);
    }
    
    if (this.offsetNum !== undefined) {
      query = (query as any).offset(this.offsetNum);
    }
    
    return query;
  }

  async then(resolve: (value: { data: any[] | null; error: any | null; count?: number | null }) => void) {
    try {
      if (this.headOnly && this.countRequested) {
        // 只请求 count，不返回数据
        const countQuery = this.db.select({ count: sql`count(*)` }).from(this.table);
        const countResult = await (this.wheres.length > 0 
          ? countQuery.where(and(...this.wheres)) 
          : countQuery);
        resolve({ data: null, error: null, count: Number(countResult[0]?.count) || 0 });
      } else if (this.countRequested) {
        // 请求 count 和数据
        const data = await this.buildQuery();
        const countQuery = this.db.select({ count: sql`count(*)` }).from(this.table);
        const countResult = await (this.wheres.length > 0 
          ? countQuery.where(and(...this.wheres)) 
          : countQuery);
        resolve({ data: data as any[], error: null, count: Number(countResult[0]?.count) || 0 });
      } else {
        const data = await this.buildQuery();
        resolve({ data: data as any[], error: null });
      }
    } catch (error) {
      resolve({ data: null, error, count: null });
    }
  }

  async single(): Promise<{ data: any | null; error: any | null }> {
    this.limitNum = 1;
    try {
      const data = await this.buildQuery();
      return { data: (data as any[])?.[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async maybeSingle(): Promise<{ data: any | null; error: any | null }> {
    return this.single();
  }
}

// 插入构建器 - 支持 .insert().select().single() 链式调用
class InsertBuilder {
  private table: any;
  private tableName: string;
  private values: any | any[];
  private shouldSelect = false;

  constructor(tableName: string, values: any | any[]) {
    this.tableName = tableName;
    this.table = tables[tableName];
    this.values = values;
  }

  select(fields?: string | string[]): this {
    this.shouldSelect = true;
    return this;
  }

  async single(): Promise<{ data: any | null; error: any | null }> {
    const result = await this.execute();
    return { data: (result.data as any[])?.[0] || null, error: result.error };
  }

  private async execute(): Promise<{ data: any | null; error: any | null }> {
    try {
      const db = getDb();
      await db.insert(this.table).values(this.values);
      
      if (this.shouldSelect) {
        // 返回刚插入的数据（对于单个插入，取最后一条）
        const inserted = await db.select().from(this.table).orderBy(desc(this.table.id)).limit(1);
        return { data: inserted, error: null };
      }
      
      return { data: this.values, error: null };
    } catch (error) {
      console.error('Insert error:', error);
      return { data: null, error };
    }
  }

  async then(resolve: (value: { data: any | null; error: any | null }) => void) {
    const result = await this.execute();
    resolve(result);
  }
}

// 表操作类
class TableClient {
  private tableName: string;
  private table: any;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.table = tables[tableName];
  }

  select(fields?: string | string[], options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): QueryBuilder {
    const builder = new QueryBuilder(this.tableName);
    builder.select(fields, options);
    return builder;
  }

  insert(values: any | any[]): InsertBuilder {
    return new InsertBuilder(this.tableName, values);
  }

  update(values: any): UpdateBuilder {
    return new UpdateBuilder(this.tableName, values);
  }

  delete(): DeleteBuilder {
    return new DeleteBuilder(this.tableName);
  }

  async upsert(values: any, options?: { onConflict?: string }): Promise<{ data: any | null; error: any | null }> {
    try {
      const db = getDb();
      const result = await db.insert(this.table).values(values).onDuplicateKeyUpdate({ ...values });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// 更新构建器
class UpdateBuilder {
  private table: any;
  private db: ReturnType<typeof getDb>;
  private values: any;
  private wheres: SQL[] = [];

  constructor(tableName: string, values: any) {
    this.table = tables[tableName];
    this.db = getDb();
    this.values = values;
  }

  eq(column: string, value: any): this {
    this.wheres.push(eq(this.table[column], value));
    return this;
  }

  neq(column: string, value: any): this {
    this.wheres.push(sql`${this.table[column]} != ${value}`);
    return this;
  }

  select(_fields?: string | string[]): this {
    // Update 后的 select 通常返回更新后的数据
    // 这里只是标记需要返回数据
    return this;
  }

  async single(): Promise<{ data: any | null; error: any | null }> {
    const result = await this.execute();
    return { data: (result.data as any[])?.[0] || null, error: result.error };
  }

  private async execute(): Promise<{ data: any | null; error: any | null }> {
    try {
      let query = this.db.update(this.table).set(this.values);
      if (this.wheres.length > 0) {
        query = query.where(and(...this.wheres)) as any;
      }
      const data = await query;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async then(resolve: (value: { data: any | null; error: any | null }) => void) {
    const result = await this.execute();
    resolve(result);
  }
}

// 删除构建器
class DeleteBuilder {
  private table: any;
  private db: ReturnType<typeof getDb>;
  private wheres: SQL[] = [];

  constructor(tableName: string) {
    this.table = tables[tableName];
    this.db = getDb();
  }

  eq(column: string, value: any): this {
    this.wheres.push(eq(this.table[column], value));
    return this;
  }

  neq(column: string, value: any): this {
    this.wheres.push(sql`${this.table[column]} != ${value}`);
    return this;
  }

  async then(resolve: (value: { data: any | null; error: any | null }) => void) {
    try {
      let query = this.db.delete(this.table);
      if (this.wheres.length > 0) {
        query = query.where(and(...this.wheres)) as any;
      }
      const data = await query;
      resolve({ data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

// 数据库客户端
class DatabaseClient {
  from(tableName: string): TableClient {
    return new TableClient(tableName);
  }

  get db() {
    return getDb();
  }

  get schema() {
    return schema;
  }
}

// 导出
export const db = new DatabaseClient();
export const getSupabaseClient = () => db;
export const getSupabaseCredentials = getMySQLConfig;
export const loadEnv = () => {};
export { schema };
