/**
 * 检查 bases 表的所有字段
 */

import { Pool } from 'pg';

async function checkColumns() {
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
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bases' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 bases 表字段列表:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? '可空' : '非空'})`);
    });
    
    // 查询一条数据看看
    const dataResult = await pool.query(`
      SELECT * FROM bases LIMIT 1
    `);
    
    if (dataResult.rows.length > 0) {
      console.log('\n📊 示例数据:');
      const row = dataResult.rows[0];
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value || '(空)'}`);
      });
    }
    
  } finally {
    await pool.end();
  }
}

checkColumns();
