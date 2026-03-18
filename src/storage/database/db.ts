/**
 * 数据库客户端 - 原生 Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './shared/schema';

// 连接池配置
function getMySQLConfig() {
  return {
    host: process.env.MYSQL_HOST || process.env.COZE_MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.COZE_MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || process.env.COZE_MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.COZE_MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.COZE_MYSQL_DATABASE || 'pi_cube',
  };
}

// 单例连接池
let pool: mysql.Pool | null = null;

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

// 导出数据库客户端
export const db = drizzle(getPool(), { schema, mode: 'default' });

// 导出 schema 供使用
export * from './shared/schema';

// 导出 drizzle 操作符
export { eq, ne, gt, gte, lt, lte, and, or, desc, asc, sql, inArray, isNull, isNotNull, like } from 'drizzle-orm';
