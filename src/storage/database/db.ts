import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';
import { getPostgresPool } from './postgres-pool';

export const db = drizzle(getPostgresPool(), { schema });

export * from './shared/schema';
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  desc,
  asc,
  sql,
  inArray,
  isNull,
  isNotNull,
  like,
} from 'drizzle-orm';
