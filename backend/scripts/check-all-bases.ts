/**
 * 查看所有基地的管理公司和地址模板信息
 */

import { Pool } from 'pg';

async function checkAllBases() {
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
    const result = await pool.query(`
      SELECT id, name, address_template, management_company_name
      FROM bases 
      ORDER BY created_at DESC
    `);
    
    console.log('📋 所有基地数据:');
    result.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   地址模板: ${row.address_template || '(未设置)'}`);
      console.log(`   管理公司: ${row.management_company_name || '(未设置)'}`);
    });
    
  } finally {
    await pool.end();
  }
}

checkAllBases();
