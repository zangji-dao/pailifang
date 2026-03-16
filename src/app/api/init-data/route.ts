import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const results: any = {};

    // 1. 创建管理员账号
    const { data: adminUser, error: adminError } = await client
      .from("users")
      .select("id")
      .eq("email", "admin@example.com")
      .single();

    if (!adminUser) {
      const { data: newAdmin, error: insertError } = await client
        .from("users")
        .insert({
          email: "admin@example.com",
          password: "admin123",
          name: "系统管理员",
          role: "admin",
          is_active: true,
        })
        .select()
        .single();
      if (insertError) {
        console.error("创建管理员失败:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      results.admin = newAdmin;
    } else {
      results.admin = adminUser;
    }

    // 2. 创建会计账号
    const { data: accountantUser } = await client
      .from("users")
      .select("id")
      .eq("email", "accountant@example.com")
      .single();

    let accountantId = accountantUser?.id;
    if (!accountantUser) {
      const { data: newAccountant, error: insertError } = await client
        .from("users")
        .insert({
          email: "accountant@example.com",
          password: "accountant123",
          name: "张会计",
          role: "accountant",
          phone: "13800138001",
          is_active: true,
        })
        .select()
        .single();
      if (insertError) {
        console.error("创建会计失败:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      accountantId = newAccountant?.id;
      results.accountant = newAccountant;
    } else {
      results.accountant = accountantUser;
    }

    // 3. 创建销售账号
    const { data: salesUser } = await client
      .from("users")
      .select("id")
      .eq("email", "sales@example.com")
      .single();

    let salesId = salesUser?.id;
    if (!salesUser) {
      const { data: newSales, error: insertError } = await client
        .from("users")
        .insert({
          email: "sales@example.com",
          password: "sales123",
          name: "李销售",
          role: "sales",
          phone: "13800138002",
          is_active: true,
        })
        .select()
        .single();
      if (insertError) {
        console.error("创建销售失败:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      salesId = newSales?.id;
      results.sales = newSales;
    } else {
      results.sales = salesUser;
    }

    // 4. 创建分润规则
    const { data: profitRule } = await client
      .from("profit_rules")
      .select("id")
      .eq("name", "标准分润规则")
      .single();

    let profitRuleId = profitRule?.id;
    if (!profitRule) {
      const { data: newRule, error: insertError } = await client
        .from("profit_rules")
        .insert({
          name: "标准分润规则",
          type: "fixed_rate",
          sales_rate: 300, // 30%
          accountant_rate: 400, // 40%
          base_amount: 0,
          is_active: true,
        })
        .select()
        .single();
      if (insertError) {
        console.error("创建分润规则失败:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      profitRuleId = newRule?.id;
      results.profitRule = newRule;
    } else {
      results.profitRule = profitRule;
    }

    // 5. 创建示例客户
    const { data: customer } = await client
      .from("customers")
      .select("id")
      .eq("name", "示例科技有限公司")
      .single();

    let customerId = customer?.id;
    if (!customer) {
      const { data: newCustomer, error: insertError } = await client
        .from("customers")
        .insert({
          name: "示例科技有限公司",
          contact_person: "王总",
          contact_phone: "13900139000",
          email: "contact@example.com",
          address: "北京市朝阳区",
          sales_id: salesId || null,
          status: "cooperative",
        })
        .select()
        .single();
      if (insertError) {
        console.error("创建客户失败:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      customerId = newCustomer?.id;
      results.customer = newCustomer;
    } else {
      results.customer = customer;
    }

    // 6. 创建示例账套
    if (customerId && accountantId) {
      const { data: ledger } = await client
        .from("ledgers")
        .select("id")
        .eq("name", "2024年度税务申报")
        .single();

      if (!ledger) {
        const { data: newLedger, error: insertError } = await client
          .from("ledgers")
          .insert({
            name: "2024年度税务申报",
            customer_id: customerId,
            accountant_id: accountantId,
            year: 2024,
            status: "active",
            description: "2024年度税务申报账套",
          })
          .select()
          .single();
        if (insertError) {
          console.error("创建账套失败:", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        results.ledger = newLedger;
      } else {
        results.ledger = ledger;
      }
    }

    return NextResponse.json({
      success: true,
      message: "初始化数据成功",
      data: {
        adminEmail: "admin@example.com",
        adminPassword: "admin123",
        accountantEmail: "accountant@example.com",
        accountantPassword: "accountant123",
        salesEmail: "sales@example.com",
        salesPassword: "sales123",
        results,
      },
    });
  } catch (error) {
    console.error("初始化数据失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "初始化数据失败" },
      { status: 500 }
    );
  }
}
