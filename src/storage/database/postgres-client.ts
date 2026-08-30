import type { QueryResult as PgQueryResult } from 'pg';
import { getPostgresPool } from './postgres-pool';

export interface DatabaseError {
  message: string;
  code?: string;
  details?: unknown;
  hint?: string;
}

export interface DatabaseResult<T = any> {
  data: T | null;
  error: DatabaseError | null;
  count: number | null;
  status: number;
  statusText: string;
}

type QueryAction = 'select' | 'insert' | 'update' | 'delete' | 'upsert';
type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';

interface ComparisonFilter {
  kind: 'comparison';
  column: string;
  operator: ComparisonOperator;
  value: unknown;
  negate?: boolean;
}

interface InFilter {
  kind: 'in';
  column: string;
  values: unknown[];
  negate: boolean;
}

interface IsFilter {
  kind: 'is';
  column: string;
  value: unknown;
  negate: boolean;
}

interface OrFilter {
  kind: 'or';
  filters: Array<ComparisonFilter | IsFilter>;
}

type QueryFilter = ComparisonFilter | InFilter | IsFilter | OrFilter;

interface SortRule {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

interface SelectNode {
  name: string;
  alias?: string;
  children?: SelectNode[];
  wildcard?: boolean;
}

interface RelationDefinition {
  cardinality: 'one' | 'many';
  sourceColumn: string;
  targetColumn: string;
  targetTable: string;
}

interface ColumnMetadata {
  dataType: string;
  udtName: string;
  primaryKey: boolean;
}

interface SelectOptions {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
}

interface UpsertOptions {
  onConflict?: string;
  ignoreDuplicates?: boolean;
}

const relationDefinitions: Record<string, RelationDefinition> = {
  'meters.bases': {
    cardinality: 'one',
    sourceColumn: 'base_id',
    targetColumn: 'id',
    targetTable: 'bases',
  },
  'meters.spaces': {
    cardinality: 'many',
    sourceColumn: 'id',
    targetColumn: 'meter_id',
    targetTable: 'spaces',
  },
  'spaces.bases': {
    cardinality: 'one',
    sourceColumn: 'base_id',
    targetColumn: 'id',
    targetTable: 'bases',
  },
  'spaces.meters': {
    cardinality: 'one',
    sourceColumn: 'meter_id',
    targetColumn: 'id',
    targetTable: 'meters',
  },
  'spaces.registration_numbers': {
    cardinality: 'many',
    sourceColumn: 'id',
    targetColumn: 'space_id',
    targetTable: 'registration_numbers',
  },
  'registration_numbers.enterprises': {
    cardinality: 'one',
    sourceColumn: 'enterprise_id',
    targetColumn: 'id',
    targetTable: 'enterprises',
  },
  'registration_numbers.spaces': {
    cardinality: 'one',
    sourceColumn: 'space_id',
    targetColumn: 'id',
    targetTable: 'spaces',
  },
};

const columnMetadataCache = new Map<string, Map<string, ColumnMetadata>>();

function assertIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`不安全的数据库标识符: ${value}`);
  }

  return value;
}

function quoteIdentifier(value: string): string {
  return `"${assertIdentifier(value)}"`;
}

function splitTableName(value: string): { schema: string; table: string } {
  const parts = value.split('.');

  if (parts.length === 1) {
    return { schema: 'public', table: assertIdentifier(parts[0]) };
  }

  if (parts.length === 2) {
    return {
      schema: assertIdentifier(parts[0]),
      table: assertIdentifier(parts[1]),
    };
  }

  throw new Error(`不支持的表名: ${value}`);
}

function quoteTable(value: string): string {
  const { schema, table } = splitTableName(value);
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

function splitTopLevel(value: string, delimiter = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === delimiter && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function parseSelect(value: string | undefined): SelectNode[] {
  const expression = value?.trim() || '*';

  return splitTopLevel(expression).map((part) => {
    if (part === '*') {
      return { name: '*', wildcard: true };
    }

    const relationStart = part.indexOf('(');
    if (relationStart !== -1 && part.endsWith(')')) {
      const relationName = part.slice(0, relationStart).trim().replace(/!.*$/, '');
      const relationParts = relationName.split(':').map((item) => item.trim());
      const name = relationParts.length === 2 ? relationParts[1] : relationParts[0];
      const alias = relationParts.length === 2 ? relationParts[0] : undefined;

      return {
        name: assertIdentifier(name),
        alias: alias ? assertIdentifier(alias) : undefined,
        children: parseSelect(part.slice(relationStart + 1, -1)),
      };
    }

    const fieldParts = part.split(':').map((item) => item.trim());
    const name = fieldParts.length === 2 ? fieldParts[1] : fieldParts[0];
    const alias = fieldParts.length === 2 ? fieldParts[0] : undefined;

    return {
      name: assertIdentifier(name),
      alias: alias ? assertIdentifier(alias) : undefined,
    };
  });
}

function projectRow(row: Record<string, any>, nodes: SelectNode[]): Record<string, any> {
  const wildcard = nodes.some((node) => node.wildcard);
  const projected: Record<string, any> = wildcard ? { ...row } : {};

  for (const node of nodes) {
    if (node.wildcard) {
      continue;
    }

    projected[node.alias || node.name] = row[node.alias || node.name] ?? row[node.name];
  }

  return projected;
}

function keyFor(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
}

function asDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: string; detail?: string; hint?: string };
    return {
      message: candidate.message,
      code: candidate.code,
      details: candidate.detail,
      hint: candidate.hint,
    };
  }

  return { message: String(error) };
}

function success<T>(data: T | null, count: number | null = null): DatabaseResult<T> {
  return {
    data,
    error: null,
    count,
    status: 200,
    statusText: 'OK',
  };
}

function failure(error: unknown): DatabaseResult<never> {
  return {
    data: null,
    error: asDatabaseError(error),
    count: null,
    status: 500,
    statusText: 'Database Error',
  };
}

async function getColumnMetadata(tableName: string): Promise<Map<string, ColumnMetadata>> {
  const cached = columnMetadataCache.get(tableName);
  if (cached) {
    return cached;
  }

  const { schema, table } = splitTableName(tableName);
  const result = await getPostgresPool().query<{
    column_name: string;
    data_type: string;
    udt_name: string;
    primary_key: boolean;
  }>(
    `
      SELECT
        columns.column_name,
        columns.data_type,
        columns.udt_name,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints constraints
          JOIN information_schema.key_column_usage key_columns
            ON constraints.constraint_name = key_columns.constraint_name
           AND constraints.table_schema = key_columns.table_schema
          WHERE constraints.constraint_type = 'PRIMARY KEY'
            AND constraints.table_schema = columns.table_schema
            AND constraints.table_name = columns.table_name
            AND key_columns.column_name = columns.column_name
        ) AS primary_key
      FROM information_schema.columns columns
      WHERE columns.table_schema = $1 AND columns.table_name = $2
    `,
    [schema, table],
  );

  const metadata = new Map<string, ColumnMetadata>();
  for (const row of result.rows) {
    metadata.set(row.column_name, {
      dataType: row.data_type,
      udtName: row.udt_name,
      primaryKey: row.primary_key,
    });
  }

  columnMetadataCache.set(tableName, metadata);
  return metadata;
}

function serializeValue(value: unknown, metadata: ColumnMetadata | undefined): unknown {
  if (value === undefined) {
    return null;
  }

  if (value !== null && metadata && (metadata.dataType === 'json' || metadata.dataType === 'jsonb')) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  return value;
}

class SqlBuilder {
  readonly values: unknown[] = [];

  parameter(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

export class PostgresQueryBuilder implements PromiseLike<DatabaseResult<any[]>> {
  private readonly table: string;
  private action: QueryAction = 'select';
  private input: Record<string, any> | Array<Record<string, any>> | null = null;
  private filters: QueryFilter[] = [];
  private sortRules: SortRule[] = [];
  private selectedFields = '*';
  private returningFields: string | null = null;
  private countMode: SelectOptions['count'];
  private head = false;
  private rowLimit: number | null = null;
  private rowOffset = 0;
  private upsertOptions: UpsertOptions = {};

  constructor(table: string) {
    splitTableName(table);
    this.table = table;
  }

  select(fields = '*', options: SelectOptions = {}): this {
    if (this.action === 'select') {
      this.selectedFields = fields;
      this.countMode = options.count;
      this.head = options.head === true;
    } else {
      this.returningFields = fields;
    }

    return this;
  }

  insert(values: Record<string, any> | Array<Record<string, any>>): this {
    this.action = 'insert';
    this.input = values;
    return this;
  }

  update(values: Record<string, any>): this {
    this.action = 'update';
    this.input = values;
    return this;
  }

  delete(): this {
    this.action = 'delete';
    this.input = null;
    return this;
  }

  upsert(values: Record<string, any> | Array<Record<string, any>>, options: UpsertOptions = {}): this {
    this.action = 'upsert';
    this.input = values;
    this.upsertOptions = options;
    return this;
  }

  eq(column: string, value: unknown): this {
    return this.addComparison(column, 'eq', value);
  }

  neq(column: string, value: unknown): this {
    return this.addComparison(column, 'neq', value);
  }

  gt(column: string, value: unknown): this {
    return this.addComparison(column, 'gt', value);
  }

  gte(column: string, value: unknown): this {
    return this.addComparison(column, 'gte', value);
  }

  lt(column: string, value: unknown): this {
    return this.addComparison(column, 'lt', value);
  }

  lte(column: string, value: unknown): this {
    return this.addComparison(column, 'lte', value);
  }

  like(column: string, value: string): this {
    return this.addComparison(column, 'like', value);
  }

  ilike(column: string, value: string): this {
    return this.addComparison(column, 'ilike', value);
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({
      kind: 'in',
      column: assertIdentifier(column),
      values,
      negate: false,
    });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({
      kind: 'is',
      column: assertIdentifier(column),
      value,
      negate: false,
    });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    const safeColumn = assertIdentifier(column);

    if (operator === 'is') {
      this.filters.push({ kind: 'is', column: safeColumn, value, negate: true });
    } else if (operator === 'in') {
      this.filters.push({
        kind: 'in',
        column: safeColumn,
        values: Array.isArray(value) ? value : [value],
        negate: true,
      });
    } else {
      this.filters.push({
        kind: 'comparison',
        column: safeColumn,
        operator: this.normalizeOperator(operator),
        value,
        negate: true,
      });
    }

    return this;
  }

  match(values: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(values)) {
      this.eq(column, value);
    }
    return this;
  }

  filter(column: string, operator: string, value: unknown): this {
    if (operator === 'is') {
      return this.is(column, value);
    }

    if (operator === 'in') {
      return this.in(column, Array.isArray(value) ? value : [value]);
    }

    return this.addComparison(column, this.normalizeOperator(operator), value);
  }

  or(expression: string): this {
    const filters: Array<ComparisonFilter | IsFilter> = splitTopLevel(expression).map((part) => {
      const match = part.match(/^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_]+)\.(.*)$/);
      if (!match) {
        throw new Error(`不支持的 or 过滤表达式: ${part}`);
      }

      const [, column, operator, rawValue] = match;
      if (operator === 'is') {
        return {
          kind: 'is',
          column,
          value: rawValue === 'null' ? null : rawValue,
          negate: false,
        };
      }

      return {
        kind: 'comparison',
        column,
        operator: this.normalizeOperator(operator),
        value: rawValue,
      };
    });

    this.filters.push({ kind: 'or', filters });
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}): this {
    this.sortRules.push({
      column: assertIdentifier(column),
      ascending: options.ascending !== false,
      nullsFirst: options.nullsFirst,
    });
    return this;
  }

  limit(value: number): this {
    this.rowLimit = Math.max(0, value);
    return this;
  }

  range(from: number, to: number): this {
    this.rowOffset = Math.max(0, from);
    this.rowLimit = Math.max(0, to - from + 1);
    return this;
  }

  async single(): Promise<DatabaseResult<any>> {
    const result = await this.execute();
    if (result.error) {
      return result;
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    if (rows.length !== 1) {
      return {
        data: null,
        error: {
          message: `查询应返回一行，实际返回 ${rows.length} 行`,
          code: 'PGRST116',
        },
        count: result.count,
        status: 406,
        statusText: 'Not Acceptable',
      };
    }

    return { ...result, data: rows[0] };
  }

  async maybeSingle(): Promise<DatabaseResult<any>> {
    const result = await this.execute();
    if (result.error) {
      return result;
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    if (rows.length > 1) {
      return {
        data: null,
        error: {
          message: `查询最多返回一行，实际返回 ${rows.length} 行`,
          code: 'PGRST116',
        },
        count: result.count,
        status: 406,
        statusText: 'Not Acceptable',
      };
    }

    return { ...result, data: rows[0] || null };
  }

  then<TResult1 = DatabaseResult<any[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResult<any[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private addComparison(column: string, operator: ComparisonOperator, value: unknown): this {
    this.filters.push({
      kind: 'comparison',
      column: assertIdentifier(column),
      operator,
      value,
    });
    return this;
  }

  private normalizeOperator(operator: string): ComparisonOperator {
    const normalized = operator.toLowerCase() as ComparisonOperator;
    if (!['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike'].includes(normalized)) {
      throw new Error(`不支持的过滤操作符: ${operator}`);
    }

    return normalized;
  }

  private async execute(): Promise<DatabaseResult<any[]>> {
    try {
      if (this.action === 'select') {
        return await this.executeSelect();
      }

      return await this.executeWrite();
    } catch (error) {
      return failure(error);
    }
  }

  private buildWhere(sql: SqlBuilder): string {
    if (this.filters.length === 0) {
      return '';
    }

    const clauses = this.filters.map((filter) => this.buildFilter(filter, sql));
    return ` WHERE ${clauses.join(' AND ')}`;
  }

  private buildFilter(filter: QueryFilter | ComparisonFilter | IsFilter, sql: SqlBuilder): string {
    if (filter.kind === 'comparison') {
      let expression: string;
      if (filter.value === null && (filter.operator === 'eq' || filter.operator === 'neq')) {
        expression = `${quoteIdentifier(filter.column)} IS ${filter.operator === 'neq' ? 'NOT ' : ''}NULL`;
        return filter.negate ? `NOT (${expression})` : expression;
      }

      const operators: Record<ComparisonOperator, string> = {
        eq: '=',
        neq: '<>',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        like: 'LIKE',
        ilike: 'ILIKE',
      };
      expression = `${quoteIdentifier(filter.column)} ${operators[filter.operator]} ${sql.parameter(filter.value)}`;
      return filter.negate ? `NOT (${expression})` : expression;
    }

    if (filter.kind === 'in') {
      if (filter.values.length === 0) {
        return filter.negate ? 'TRUE' : 'FALSE';
      }

      return `${quoteIdentifier(filter.column)} ${filter.negate ? '<> ALL' : '= ANY'}(${sql.parameter(filter.values)})`;
    }

    if (filter.kind === 'is') {
      if (filter.value === null) {
        return `${quoteIdentifier(filter.column)} IS ${filter.negate ? 'NOT ' : ''}NULL`;
      }

      if (typeof filter.value === 'boolean') {
        return `${quoteIdentifier(filter.column)} IS ${filter.negate ? 'NOT ' : ''}${filter.value ? 'TRUE' : 'FALSE'}`;
      }

      return `${quoteIdentifier(filter.column)} ${filter.negate ? '<>' : '='} ${sql.parameter(filter.value)}`;
    }

    return `(${filter.filters.map((item) => this.buildFilter(item, sql)).join(' OR ')})`;
  }

  private buildOrder(): string {
    if (this.sortRules.length === 0) {
      return '';
    }

    const expressions = this.sortRules.map((rule) => {
      const nulls = rule.nullsFirst === undefined ? '' : ` NULLS ${rule.nullsFirst ? 'FIRST' : 'LAST'}`;
      return `${quoteIdentifier(rule.column)} ${rule.ascending ? 'ASC' : 'DESC'}${nulls}`;
    });
    return ` ORDER BY ${expressions.join(', ')}`;
  }

  private buildPagination(sql: SqlBuilder): string {
    let expression = '';
    if (this.rowLimit !== null) {
      expression += ` LIMIT ${sql.parameter(this.rowLimit)}`;
    }
    if (this.rowOffset > 0) {
      expression += ` OFFSET ${sql.parameter(this.rowOffset)}`;
    }
    return expression;
  }

  private async executeSelect(): Promise<DatabaseResult<any[]>> {
    const selectedNodes = parseSelect(this.selectedFields);
    const sql = new SqlBuilder();
    const where = this.buildWhere(sql);
    const count = this.countMode
      ? Number((await getPostgresPool().query(
        `SELECT COUNT(*)::bigint AS count FROM ${quoteTable(this.table)}${where}`,
        sql.values,
      )).rows[0]?.count || 0)
      : null;

    if (this.head) {
      return success(null, count) as unknown as DatabaseResult<any[]>;
    }

    const querySql = new SqlBuilder();
    const queryWhere = this.buildWhere(querySql);
    const statement = `SELECT * FROM ${quoteTable(this.table)}${queryWhere}${this.buildOrder()}${this.buildPagination(querySql)}`;
    const result = await getPostgresPool().query(statement, querySql.values);
    const rows = result.rows.map((row) => ({ ...row }));

    await this.hydrateRelations(this.table, rows, selectedNodes);
    return success(rows.map((row) => projectRow(row, selectedNodes)), count);
  }

  private async hydrateRelations(
    sourceTable: string,
    rows: Array<Record<string, any>>,
    selectedNodes: SelectNode[],
  ): Promise<void> {
    const relationNodes = selectedNodes.filter((node) => node.children);

    for (const node of relationNodes) {
      const relation = relationDefinitions[`${splitTableName(sourceTable).table}.${node.name}`];
      if (!relation) {
        throw new Error(`未配置数据库关联: ${sourceTable}.${node.name}`);
      }

      const sourceValues = Array.from(new Set(
        rows
          .map((row) => row[relation.sourceColumn])
          .filter((value) => value !== null && value !== undefined)
          .map(keyFor),
      ));

      if (sourceValues.length === 0) {
        for (const row of rows) {
          row[node.alias || node.name] = relation.cardinality === 'many' ? [] : null;
        }
        continue;
      }

      const rawSourceValues = rows
        .map((row) => row[relation.sourceColumn])
        .filter((value, index, values) => value !== null && value !== undefined
          && values.findIndex((candidate) => keyFor(candidate) === keyFor(value)) === index);
      const relatedResult = await getPostgresPool().query(
        `SELECT * FROM ${quoteTable(relation.targetTable)} WHERE ${quoteIdentifier(relation.targetColumn)} = ANY($1)`,
        [rawSourceValues],
      );
      const relatedRows = relatedResult.rows.map((row) => ({ ...row }));
      await this.hydrateRelations(relation.targetTable, relatedRows, node.children || []);

      if (relation.cardinality === 'one') {
        const lookup = new Map(
          relatedRows.map((row) => [keyFor(row[relation.targetColumn]), projectRow(row, node.children || [])]),
        );
        for (const row of rows) {
          row[node.alias || node.name] = row[relation.sourceColumn] == null
            ? null
            : lookup.get(keyFor(row[relation.sourceColumn])) || null;
        }
      } else {
        const lookup = new Map<string, Array<Record<string, any>>>();
        for (const relatedRow of relatedRows) {
          const key = keyFor(relatedRow[relation.targetColumn]);
          const group = lookup.get(key) || [];
          group.push(projectRow(relatedRow, node.children || []));
          lookup.set(key, group);
        }
        for (const row of rows) {
          row[node.alias || node.name] = row[relation.sourceColumn] == null
            ? []
            : lookup.get(keyFor(row[relation.sourceColumn])) || [];
        }
      }
    }
  }

  private async executeWrite(): Promise<DatabaseResult<any[]>> {
    if (this.action === 'delete') {
      return this.executeDelete();
    }

    if (this.action === 'update') {
      return this.executeUpdate();
    }

    return this.executeInsert();
  }

  private getReturningClause(): string {
    if (this.returningFields === null) {
      return '';
    }

    const nodes = parseSelect(this.returningFields);
    if (nodes.some((node) => node.children)) {
      throw new Error('写入后的 returning 暂不支持嵌套关联');
    }

    if (nodes.some((node) => node.wildcard)) {
      return ' RETURNING *';
    }

    return ` RETURNING ${nodes.map((node) => {
      const column = quoteIdentifier(node.name);
      return node.alias ? `${column} AS ${quoteIdentifier(node.alias)}` : column;
    }).join(', ')}`;
  }

  private async executeInsert(): Promise<DatabaseResult<any[]>> {
    const inputRows = Array.isArray(this.input) ? this.input : [this.input || {}];
    if (inputRows.length === 0) {
      return success(this.returningFields === null ? null : []);
    }

    const columns = Array.from(new Set(inputRows.flatMap((row) => Object.keys(row))));
    if (columns.length === 0) {
      throw new Error('插入数据不能为空');
    }

    columns.forEach(assertIdentifier);
    const metadata = await getColumnMetadata(this.table);
    const sql = new SqlBuilder();
    const valuesExpression = inputRows.map((row) => `(${columns.map((column) => {
      if (!(column in row) || row[column] === undefined) {
        return 'DEFAULT';
      }
      return sql.parameter(serializeValue(row[column], metadata.get(column)));
    }).join(', ')})`).join(', ');

    let conflictClause = '';
    if (this.action === 'upsert') {
      const conflictColumns = this.upsertOptions.onConflict
        ? this.upsertOptions.onConflict.split(',').map((column) => assertIdentifier(column.trim()))
        : Array.from(metadata.entries()).filter(([, value]) => value.primaryKey).map(([column]) => column);

      if (conflictColumns.length === 0 || this.upsertOptions.ignoreDuplicates) {
        conflictClause = ' ON CONFLICT DO NOTHING';
      } else {
        const conflictSet = new Set(conflictColumns);
        const updateColumns = columns.filter((column) => !conflictSet.has(column));
        conflictClause = updateColumns.length === 0
          ? ' ON CONFLICT DO NOTHING'
          : ` ON CONFLICT (${conflictColumns.map(quoteIdentifier).join(', ')}) DO UPDATE SET ${updateColumns.map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`).join(', ')}`;
      }
    }

    const statement = `INSERT INTO ${quoteTable(this.table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES ${valuesExpression}${conflictClause}${this.getReturningClause()}`;
    const result = await getPostgresPool().query(statement, sql.values);
    return success(this.returningFields === null ? null : result.rows);
  }

  private async executeUpdate(): Promise<DatabaseResult<any[]>> {
    const values = this.input && !Array.isArray(this.input) ? this.input : {};
    const columns = Object.keys(values).filter((column) => values[column] !== undefined);
    if (columns.length === 0) {
      throw new Error('更新数据不能为空');
    }

    columns.forEach(assertIdentifier);
    const metadata = await getColumnMetadata(this.table);
    const sql = new SqlBuilder();
    const assignments = columns.map((column) => `${quoteIdentifier(column)} = ${sql.parameter(serializeValue(values[column], metadata.get(column)))}`);
    const where = this.buildWhere(sql);
    const statement = `UPDATE ${quoteTable(this.table)} SET ${assignments.join(', ')}${where}${this.getReturningClause()}`;
    const result = await getPostgresPool().query(statement, sql.values);
    return success(this.returningFields === null ? null : result.rows);
  }

  private async executeDelete(): Promise<DatabaseResult<any[]>> {
    const sql = new SqlBuilder();
    const where = this.buildWhere(sql);
    const statement = `DELETE FROM ${quoteTable(this.table)}${where}${this.getReturningClause()}`;
    const result = await getPostgresPool().query(statement, sql.values);
    return success(this.returningFields === null ? null : result.rows);
  }
}

export class PostgresDatabaseClient {
  from(table: string): PostgresQueryBuilder {
    return new PostgresQueryBuilder(table);
  }

  async rpc(name: string, parameters: Record<string, unknown> = {}): Promise<DatabaseResult<any[]>> {
    try {
      if (name !== 'exec_sql') {
        throw new Error(`不支持的数据库过程: ${name}`);
      }

      if (process.env.ALLOW_DATABASE_MIGRATION_API !== 'true') {
        throw new Error('数据库 DDL API 默认关闭；如需临时执行迁移，请设置 ALLOW_DATABASE_MIGRATION_API=true');
      }

      const statement = parameters.sql;
      if (typeof statement !== 'string' || !statement.trim()) {
        throw new Error('exec_sql 缺少 sql 参数');
      }

      const result: PgQueryResult = await getPostgresPool().query(statement);
      return success(result.rows || []);
    } catch (error) {
      return failure(error);
    }
  }
}

let databaseClient: PostgresDatabaseClient | null = null;

export function getPostgresClient(): PostgresDatabaseClient {
  if (!databaseClient) {
    databaseClient = new PostgresDatabaseClient();
  }

  return databaseClient;
}
