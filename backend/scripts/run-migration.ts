/**
 * 执行数据库迁移脚本
 * 用于添加 bases 表的管理公司字段和地址模板字段
 */

import { Pool } from 'pg';

async function runMigration() {
  const databaseUrl = process.env.PGDATABASE_URL || process.env.COZE_SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ 数据库连接字符串未设置');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    console.log('🔌 连接数据库...');
    
    // 检查字段是否已存在
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bases' AND column_name = 'address_template'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ 字段已存在，无需迁移');
      return;
    }
    
    console.log('📝 执行迁移...');
    
    // 添加字段
    await pool.query(`
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS address_template TEXT;
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_name VARCHAR(255);
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_credit_code VARCHAR(50);
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_legal_person VARCHAR(100);
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_address VARCHAR(500);
      ALTER TABLE bases ADD COLUMN IF NOT EXISTS management_company_phone VARCHAR(50);
    `);
    
    console.log('✅ 迁移完成！');
    
    // 验证字段
    const verifyResult = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'bases' AND column_name IN (
        'address_template', 
        'management_company_name', 
        'management_company_credit_code',
        'management_company_legal_person',
        'management_company_address',
        'management_company_phone'
      )
    `);
    
    console.log('📊 新增字段:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
