import { db } from './src/database/client';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('开始执行迁移...');
    
    // 添加注册地址字段
    await db.execute(sql`ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS registered_address VARCHAR(500)`);
    console.log('✓ 添加 registered_address 字段');
    
    // 添加经营地址字段
    await db.execute(sql`ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS business_address VARCHAR(500)`);
    console.log('✓ 添加 business_address 字段');
    
    // 添加入驻日期字段
    await db.execute(sql`ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS settled_date TIMESTAMP`);
    console.log('✓ 添加 settled_date 字段');
    
    // 添加备注字段
    await db.execute(sql`ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS remarks TEXT`);
    console.log('✓ 添加 remarks 字段');
    
    // 添加索引
    await db.execute(sql`CREATE INDEX IF NOT EXISTS enterprises_status_idx ON enterprises(status)`);
    console.log('✓ 创建 status 索引');
    
    console.log('迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

runMigration();
