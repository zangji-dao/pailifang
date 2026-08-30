import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('开始执行入驻管理表重构迁移...');

    const migrationFile = path.join(__dirname, 'migrations/redesign_settlement_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    await pool.query(sql);
    console.log('✅ 迁移执行成功！');

    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'pi_%'
      ORDER BY table_name
    `);

    console.log('\n已创建的 pi_ 开头的表:');
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
  } finally {
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('❌ 迁移执行失败:', error);
  process.exitCode = 1;
});
