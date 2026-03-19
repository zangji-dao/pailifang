import { db } from './src/database/client';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('开始添加personnel字段...');
    
    await db.execute(sql`
      ALTER TABLE pi_settlement_applications 
      ADD COLUMN IF NOT EXISTS personnel JSONB
    `);
    
    console.log('personnel字段添加成功！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrate();
