/**
 * 数据库客户端 - PostgreSQL (原生 Drizzle ORM)
 * 
 * 安全规范：所有数据库连接信息必须通过环境变量配置
 * - DATABASE_URL: 完整数据库连接字符串（优先）
 * - 或单独配置: PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

/**
 * 获取数据库配置
 * 安全要求：禁止硬编码密码等敏感信息
 */
function getPostgresConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  // 优先使用 DATABASE_URL
  if (process.env.DATABASE_URL) {
    // 解析 DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }

  // 使用单独的环境变量
  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT;
  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;
  const database = process.env.PG_DATABASE;

  // 检查必需的环境变量
  if (!host || !user || !password || !database) {
    throw new Error(
      '数据库配置缺失！请设置环境变量：\n' +
      '  - DATABASE_URL (推荐)\n' +
      '  - 或 PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE'
    );
  }

  return {
    host,
    port: parseInt(port || '5432', 10),
    user,
    password,
    database,
  };
}

// 连接池单例
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getPostgresConfig();
    pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: false,
    });
  }
  return pool;
}

// 导出数据库客户端
export const db = drizzle(getPool(), { schema });

// 导出 schema 供使用
export * from './shared/schema';

// 导出 drizzle 操作符
export { eq, ne, gt, gte, lt, lte, and, or, desc, asc, sql, inArray, isNull, isNotNull, like } from 'drizzle-orm';
