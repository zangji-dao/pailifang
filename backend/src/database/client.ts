/**
 * 数据库客户端 - Drizzle ORM
 * 
 * 使用 Drizzle ORM 连接到 Supabase PostgreSQL
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 导出 Drizzle ORM 操作符
export { eq, or, and, like, desc, asc, sql, inArray, isNull, isNotNull, between, gte, lte, gt, lt, ne } from 'drizzle-orm';

// 导出 schema
export * from './schema';

// 数据库连接配置
function getDatabaseConfig() {
  // PostgreSQL 连接字符串 (优先使用 PGDATABASE_URL)
  const databaseUrl = process.env.PGDATABASE_URL || process.env.COZE_SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('数据库连接字符串未设置 (PGDATABASE_URL, COZE_SUPABASE_DB_URL 或 DATABASE_URL)');
  }
  
  console.log(`[数据库] 连接到: ${databaseUrl.split('@')[1]?.split('/')[0] || '数据库'}`);
  return databaseUrl;
}

// 创建连接池
const pool = new Pool({
  connectionString: getDatabaseConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 创建 Drizzle 实例
export const db = drizzle(pool, { schema });

// 健康检查
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 优雅关闭
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
