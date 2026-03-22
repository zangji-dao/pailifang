import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/migrate/enterprises-new-flow
 * 执行数据库迁移：添加新流程所需的字段
 */
export async function POST() {
  try {
    const supabase = createClient();
    const results: string[] = [];

    // 1. 检查并添加 enterprises 表字段
    const alterEnterprises = `
      ALTER TABLE enterprises 
      ADD COLUMN IF NOT EXISTS base_id UUID,
      ADD COLUMN IF NOT EXISTS proof_document_url TEXT,
      ADD COLUMN IF NOT EXISTS registration_number_id UUID,
      ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50)
    `;
    
    const { error: err1 } = await supabase.rpc('exec_sql', { sql: alterEnterprises });
    if (err1) {
      results.push(`enterprises字段添加: ${err1.message}`);
    } else {
      results.push('enterprises字段添加: 成功');
    }

    // 2. 检查并添加 registration_numbers 表字段
    const alterRegNumbers = `
      ALTER TABLE registration_numbers 
      ADD COLUMN IF NOT EXISTS manual_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS assigned_enterprise_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS property_owner VARCHAR(255) DEFAULT '吉林省恒松物业管理有限公司',
      ADD COLUMN IF NOT EXISTS management_company VARCHAR(255) DEFAULT '吉林省天之企业管理咨询有限公司'
    `;
    
    const { error: err2 } = await supabase.rpc('exec_sql', { sql: alterRegNumbers });
    if (err2) {
      results.push(`registration_numbers字段添加: ${err2.message}`);
    } else {
      results.push('registration_numbers字段添加: 成功');
    }

    // 3. 更新已有数据的状态
    const updateStatus1 = `
      UPDATE enterprises 
      SET process_status = 'pending_registration' 
      WHERE type = 'tenant' 
        AND process_status = 'new' 
        AND registered_address IS NOT NULL
    `;
    
    const { error: err3 } = await supabase.rpc('exec_sql', { sql: updateStatus1 });
    if (err3) {
      results.push(`入驻企业状态更新: ${err3.message}`);
    } else {
      results.push('入驻企业状态更新: 成功');
    }

    const updateStatus2 = `
      UPDATE enterprises 
      SET process_status = 'pending_change' 
      WHERE type = 'non_tenant' 
        AND process_status = 'new'
    `;
    
    const { error: err4 } = await supabase.rpc('exec_sql', { sql: updateStatus2 });
    if (err4) {
      results.push(`非入驻企业状态更新: ${err4.message}`);
    } else {
      results.push('非入驻企业状态更新: 成功');
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('迁移失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
