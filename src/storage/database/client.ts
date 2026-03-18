/**
 * 数据库客户端 - 前端兼容层
 * 模拟 Supabase 风格 API，通过 fetch 调用后端 API
 */

// 查询构建器
class QueryBuilder {
  protected table: string;
  protected params: URLSearchParams;

  constructor(table: string) {
    this.table = table;
    this.params = new URLSearchParams();
  }

  select(_fields?: string): this {
    return this;
  }

  eq(column: string, value: any): this {
    this.params.append(column, value);
    return this;
  }

  neq(column: string, value: any): this {
    this.params.append(`${column}_neq`, value);
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

  async then(resolve: (value: { data: any[] | null; error: any | null }) => void) {
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      resolve({ data: result.data || null, error: result.error || null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }

  async single(): Promise<{ data: any | null; error: any | null }> {
    this.limit(1);
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      return { data: result.data?.[0] || null, error: result.error || null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// 更新构建器（支持 .update().eq() 链式调用）
class UpdateBuilder extends QueryBuilder {
  private values: any;

  constructor(table: string, values: any) {
    super(table);
    this.values = values;
  }

  async then(resolve: (value: { data: any | null; error: any | null }) => void) {
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
      resolve({ data: null, error });
    }
  }
}

// 删除构建器
class DeleteBuilder extends QueryBuilder {
  async then(resolve: (value: { data: any | null; error: any | null }) => void) {
    try {
      const url = `/api/${this.table}?${this.params.toString()}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      const result = await response.json();
      resolve({ data: result.data || null, error: result.error || null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

// 表客户端
class TableClient {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string): QueryBuilder {
    const builder = new QueryBuilder(this.table);
    builder.select(fields);
    return builder;
  }

  update(values: any): UpdateBuilder {
    return new UpdateBuilder(this.table, values);
  }

  delete(): DeleteBuilder {
    return new DeleteBuilder(this.table);
  }

  async insert(values: any): Promise<{ data: any | null; error: any | null }> {
    try {
      const response = await fetch(`/api/${this.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      return { data: result.data || null, error: result.error || null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async upsert(values: any): Promise<{ data: any | null; error: any | null }> {
    return this.insert(values);
  }
}

// 数据库客户端
class DatabaseClient {
  from(table: string): TableClient {
    return new TableClient(table);
  }
}

// 导出
export const db = new DatabaseClient();
export const getSupabaseClient = () => db;
