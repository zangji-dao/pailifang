/**
 * 数据库客户端 - PostgreSQL (Drizzle ORM)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 数据库连接配置
function getPostgresConfig() {
  return {
    host: process.env.PG_HOST || '152.136.12.122',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'pi_user',
    password: process.env.PG_PASSWORD || 'PiCube2024',
    database: process.env.PG_DATABASE || 'pi_cube',
  };
}

// 连接池单例
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getPostgresConfig();
    
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
      });
    } else {
      pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: false,
      });
    }
  }
  return pool;
}

// 导出数据库客户端
export const db = drizzle(getPool(), { schema });

// 导出 schema
export * from './schema';

// 导出 drizzle 操作符
export { eq, ne, gt, gte, lt, lte, and, or, desc, asc, sql, inArray, isNull, isNotNull, like } from 'drizzle-orm';
