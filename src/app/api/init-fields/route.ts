import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/init-fields
 * 初始化新流程所需的数据库字段
 * 通过尝试插入和更新来触发 Supabase 自动创建字段
 */
export async function POST() {
  try {
    const supabase = createClient();
    const results: string[] = [];

    // 1. 尝试查询 registration_numbers 表结构
    const { data: regNumSample, error: regNumError } = await supabase
      .from('registration_numbers')
      .select('id, code, manual_code, assigned_enterprise_name, property_owner, management_company')
      .limit(1);
    
    if (regNumError) {
      results.push(`registration_numbers表检查: ${regNumError.message}`);
    } else {
      results.push('registration_numbers表字段检查通过');
    }

    // 2. 尝试查询 enterprises 表结构
    const { data: entSample, error: entError } = await supabase
      .from('enterprises')
      .select('id, base_id, proof_document_url, registration_number_id, registration_number')
      .limit(1);
    
    if (entError) {
      results.push(`enterprises表检查: ${entError.message}`);
    } else {
      results.push('enterprises表字段检查通过');
    }

    // 3. 尝试更新一个工位号来设置默认值
    const { error: updateError } = await supabase
      .from('registration_numbers')
      .update({
        property_owner: '吉林省恒松物业管理有限公司',
        management_company: '吉林省天之企业管理咨询有限公司',
      })
      .is('property_owner', null);

    if (updateError) {
      results.push(`更新默认值: ${updateError.message}`);
    } else {
      results.push('更新默认值: 成功');
    }

    return NextResponse.json({
      success: true,
      results,
      message: '字段检查完成，如果某些字段不存在，请在 Supabase 控制台手动添加',
      requiredFields: {
        registration_numbers: ['manual_code', 'assigned_enterprise_name', 'property_owner', 'management_company'],
        enterprises: ['base_id', 'proof_document_url', 'registration_number_id', 'registration_number']
      }
    });
  } catch (error: any) {
    console.error('初始化失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
