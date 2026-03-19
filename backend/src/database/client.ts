/**
 * 数据库客户端 - PostgreSQL (Drizzle ORM)
 * 
 * 使用统一的环境配置模块
 * 自动判断沙箱/生产环境，使用对应的数据库
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { config } from '../config/env';

// 连接池单例
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const dbConfig = config.database;
    
    console.log(`[数据库] 环境: ${config.env}, 数据库: ${dbConfig.database}`);
    
    // 根据环境变量决定是否使用 SSL
    const sslMode = process.env.PGSSLMODE;
    const ssl = sslMode === 'require' ? { rejectUnauthorized: false } : false;
    
    pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl,
    });
  }
  return pool;
}

// 导出数据库客户端
export const db = drizzle(getPool(), { schema });

// 导出 schema
export * from './schema';

// 导出 drizzle 操作符
export { eq, ne, gt, gte, lt, lte, and, or, desc, asc, sql, inArray, isNull, isNotNull, like } from 'drizzle-orm';
