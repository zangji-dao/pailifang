/**
 * 数据库客户端 - PostgreSQL (原生 Drizzle ORM)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

// 数据库连接配置
function getPostgresConfig() {
  return {
    host: process.env.PG_HOST || process.env.COZE_SUPABASE_URL?.replace('https://', '').split('.')[0] || '152.136.12.122',
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
    
    // 判断是完整 URL 还是单独配置
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // 自建服务器禁用 SSL
      });
    } else {
      pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: false, // 自建服务器禁用 SSL
      });
    }
  }
  return pool;
}

// 导出数据库客户端
export const db = drizzle(getPool(), { schema });

// 导出 schema 供使用
export * from './shared/schema';

// 导出 drizzle 操作符
export { eq, ne, gt, gte, lt, lte, and, or, desc, asc, sql, inArray, isNull, isNotNull, like } from 'drizzle-orm';
