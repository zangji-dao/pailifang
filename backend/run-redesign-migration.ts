import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// 加载环境变量
function loadEnvFromCoze(): void {
  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;
    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('加载环境变量失败:', error);
  }
}

async function runMigration() {
  // 加载环境变量
  loadEnvFromCoze();
  
  // 从环境变量获取数据库配置
  const host = process.env.PGHOST || '152.136.12.122';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'pi_user';
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE || 'pi_cube';
  
  console.log(`数据库连接配置: ${user}@${host}:${port}/${database}`);
  
  const pool = new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('开始执行入驻管理表重构迁移...');
    
    const migrationFile = path.join(__dirname, 'migrations/redesign_settlement_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ 迁移执行成功！');
    
    // 验证表是否创建成功
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'pi_%'
      ORDER BY table_name
    `);
    
    console.log('\n已创建的 pi_ 开头的表:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 验证地址数据
    const addressesResult = await pool.query('SELECT address_code, full_address, status FROM pi_registered_addresses');
    console.log('\n已插入的地址数据:');
    addressesResult.rows.forEach(row => {
      console.log(`  - ${row.address_code}: ${row.full_address} (${row.status})`);
    });
    
  } catch (error) {
    console.error('❌ 迁移执行失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
