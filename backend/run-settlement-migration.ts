import { db } from './src/database/client';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('开始执行入驻管理表迁移...');
    
    // 1. 创建注册地址表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS registered_addresses (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        full_address VARCHAR(500) NOT NULL,
        building VARCHAR(100),
        floor VARCHAR(20),
        room VARCHAR(50),
        area DECIMAL(10, 2),
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        enterprise_id VARCHAR(36),
        assigned_at TIMESTAMP,
        remarks TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log('✓ 创建 registered_addresses 表');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS registered_addresses_code_idx ON registered_addresses(code)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS registered_addresses_status_idx ON registered_addresses(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS registered_addresses_enterprise_id_idx ON registered_addresses(enterprise_id)`);
    
    // 2. 创建入驻申请表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settlement_applications (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(100),
        contact_phone VARCHAR(20),
        application_type VARCHAR(20) NOT NULL,
        settlement_type VARCHAR(20) NOT NULL,
        approval_form_url TEXT,
        approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        address_id VARCHAR(36),
        address_assigned_at TIMESTAMP,
        enterprise_id VARCHAR(36),
        remarks TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log('✓ 创建 settlement_applications 表');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_applications_enterprise_name_idx ON settlement_applications(enterprise_name)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_applications_approval_status_idx ON settlement_applications(approval_status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_applications_application_type_idx ON settlement_applications(application_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_applications_address_id_idx ON settlement_applications(address_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_applications_enterprise_id_idx ON settlement_applications(enterprise_id)`);
    
    // 3. 创建入驻流程表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settlement_processes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(36) NOT NULL,
        enterprise_id VARCHAR(36),
        process_type VARCHAR(20) NOT NULL,
        current_stage VARCHAR(50),
        stage_progress JSONB,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        remarks TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log('✓ 创建 settlement_processes 表');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_processes_application_id_idx ON settlement_processes(application_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_processes_enterprise_id_idx ON settlement_processes(enterprise_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_processes_current_stage_idx ON settlement_processes(current_stage)`);
    
    // 4. 创建合同表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id VARCHAR(36) NOT NULL,
        application_id VARCHAR(36),
        contract_no VARCHAR(50),
        contract_type VARCHAR(20) NOT NULL,
        rent_amount DECIMAL(12, 2),
        deposit_amount DECIMAL(12, 2),
        tax_commitment DECIMAL(12, 2),
        start_date DATE,
        end_date DATE,
        signed_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        contract_file_url TEXT,
        remarks TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log('✓ 创建 contracts 表');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS contracts_enterprise_id_idx ON contracts(enterprise_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS contracts_application_id_idx ON contracts(application_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS contracts_contract_no_idx ON contracts(contract_no)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(status)`);
    
    // 5. 创建费用记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settlement_payments (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id VARCHAR(36),
        application_id VARCHAR(36),
        contract_id VARCHAR(36),
        payment_type VARCHAR(20) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        paid_amount DECIMAL(12, 2),
        payment_method VARCHAR(20),
        payment_date TIMESTAMP,
        payment_voucher TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        remarks TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);
    console.log('✓ 创建 settlement_payments 表');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_payments_enterprise_id_idx ON settlement_payments(enterprise_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_payments_application_id_idx ON settlement_payments(application_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_payments_contract_id_idx ON settlement_payments(contract_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_payments_status_idx ON settlement_payments(status)`);
    
    console.log('迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

runMigration();
