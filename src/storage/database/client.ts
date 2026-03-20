/**
 * 数据库客户端 - 前端兼容层
 * 模拟 Supabase 风格 API，通过 fetch 调用后端 API
 */

// 类型定义
export interface DbError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: DbError | null;
}

export interface SingleResult<T> {
  data: T | null;
  error: DbError | null;
}

export type TableRow = Record<string, unknown>;
export type UpdateValues = Record<string, unknown>;

// 基础查询参数构建器
class QueryParamsBuilder {
  protected table: string;
  protected params: URLSearchParams;

  constructor(table: string) {
    this.table = table;
    this.params = new URLSearchParams();
  }

  select(_fields?: string): this {
    return this;
  }

  eq(column: string, value: string | number | boolean): this {
    this.params.append(column, String(value));
    return this;
  }

  neq(column: string, value: string | number | boolean): this {
    this.params.append(`${column}_neq`, String(value));
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.params.append(`${column}_ilike`, pattern);
    return this;
  }

  order(_column: string, _options?: { ascending?: boolean }): this {
    return this;
  }

  limit(n: number): this {
    this.params.append('limit', String(n));
    return this;
  }
}

// 查询构建器
class QueryBuilder<T extends TableRow = TableRow> extends QueryParamsBuilder {
  async then(resolve: (value: QueryResult<T>) => void): Promise<void> {
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      resolve({ data: result.data || null, error: result.error || null });
    } catch (error) {
      resolve({
        data: null,
        error: { message: error instanceof Error ? error.message : '请求失败' }
      });
    }
  }

  async single(): Promise<SingleResult<T>> {
    this.limit(1);
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      return { data: result.data?.[0] || null, error: result.error || null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : '请求失败' }
      };
    }
  }
}

// 更新构建器
class UpdateBuilder<T extends TableRow = TableRow> extends QueryParamsBuilder {
  private values: UpdateValues;

  constructor(table: string, values: UpdateValues) {
    super(table);
    this.values = values;
  }

  async then(resolve: (value: SingleResult<T>) => void): Promise<void> {
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.values, ...Object.fromEntries(this.params) }),
      });
      const result = await response.json();
      resolve({ data: result.data || null, error: result.error || null });
    } catch (error) {
      resolve({
        data: null,
        error: { message: error instanceof Error ? error.message : '请求失败' }
      });
    }
  }
}

// 删除构建器
class DeleteBuilder<T extends TableRow = TableRow> extends QueryParamsBuilder {
  async then(resolve: (value: SingleResult<T>) => void): Promise<void> {
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      const result = await response.json();
      resolve({ data: result.data || null, error: result.error || null });
    } catch (error) {
      resolve({
        data: null,
        error: { message: error instanceof Error ? error.message : '请求失败' }
      });
    }
  }
}

// 表客户端
class TableClient<T extends TableRow = TableRow> {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string): QueryBuilder<T> {
    const builder = new QueryBuilder<T>(this.table);
    builder.select(fields);
    return builder;
  }

  update(values: UpdateValues): UpdateBuilder<T> {
    return new UpdateBuilder<T>(this.table, values);
  }

  delete(): DeleteBuilder<T> {
    return new DeleteBuilder<T>(this.table);
  }

  async insert(values: UpdateValues): Promise<SingleResult<T>> {
    try {
      const response = await fetch(`/api/${this.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      return { data: result.data || null, error: result.error || null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : '请求失败' }
      };
    }
  }

  async upsert(values: UpdateValues): Promise<SingleResult<T>> {
    return this.insert(values);
  }
}

// 数据库客户端
class DatabaseClient {
  from<T extends TableRow = TableRow>(table: string): TableClient<T> {
    return new TableClient<T>(table);
  }
}

// 导出
export const db = new DatabaseClient();
export const getSupabaseClient = () => db;
