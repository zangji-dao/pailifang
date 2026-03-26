/**
 * 验证刚创建的基地数据
 */

import { Pool } from 'pg';

async function verifyData() {
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
      SELECT id, name, address_template, management_company_name, management_company_credit_code
      FROM bases 
      WHERE name = '测试基地'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ 找到测试数据:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ 未找到测试数据');
    }
    
  } finally {
    await pool.end();
  }
}

verifyData();
