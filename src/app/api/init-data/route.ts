import { NextRequest, NextResponse } from "next/server";
import { db, users, profitRules, customers, ledgers, eq } from "@/storage/database/db";

export async function POST(req: NextRequest) {
  try {
    const results: any = {};

    // 1. 创建管理员账号
    const adminExists = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .limit(1);

    if (adminExists.length === 0) {
      await db.insert(users).values({
        email: "admin@example.com",
        password: "admin123",
        name: "系统管理员",
        role: "admin",
        isActive: true,
      });
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.email, "admin@example.com"))
        .limit(1);
      results.admin = admin[0];
    } else {
      results.admin = adminExists[0];
    }

    // 2. 创建会计账号
    const accountantExists = await db
      .select()
      .from(users)
      .where(eq(users.email, "accountant@example.com"))
      .limit(1);

    let accountantId: string | undefined;
    if (accountantExists.length === 0) {
      await db.insert(users).values({
        email: "accountant@example.com",
        password: "accountant123",
        name: "张会计",
        role: "accountant",
        phone: "13800138001",
        isActive: true,
      });
      const accountant = await db
        .select()
        .from(users)
        .where(eq(users.email, "accountant@example.com"))
        .limit(1);
      accountantId = accountant[0]?.id;
      results.accountant = accountant[0];
    } else {
      accountantId = accountantExists[0]?.id;
      results.accountant = accountantExists[0];
    }

    // 3. 创建销售账号
    const salesExists = await db
      .select()
      .from(users)
      .where(eq(users.email, "sales@example.com"))
      .limit(1);

    let salesId: string | undefined;
    if (salesExists.length === 0) {
      await db.insert(users).values({
        email: "sales@example.com",
        password: "sales123",
        name: "李销售",
        role: "sales",
        phone: "13800138002",
        isActive: true,
      });
      const sales = await db
        .select()
        .from(users)
        .where(eq(users.email, "sales@example.com"))
        .limit(1);
      salesId = sales[0]?.id;
      results.sales = sales[0];
    } else {
      salesId = salesExists[0]?.id;
      results.sales = salesExists[0];
    }

    // 4. 创建分润规则
    const ruleExists = await db
      .select()
      .from(profitRules)
      .where(eq(profitRules.name, "标准分润规则"))
      .limit(1);

    let profitRuleId: string | undefined;
    if (ruleExists.length === 0) {
      await db.insert(profitRules).values({
        name: "标准分润规则",
        type: "fixed_rate",
        salesRate: 300, // 30%
        accountantRate: 400, // 40%
        baseAmount: 0,
        isActive: true,
      });
      const rule = await db
        .select()
        .from(profitRules)
        .where(eq(profitRules.name, "标准分润规则"))
        .limit(1);
      profitRuleId = rule[0]?.id;
      results.profitRule = rule[0];
    } else {
      profitRuleId = ruleExists[0]?.id;
      results.profitRule = ruleExists[0];
    }

    // 5. 创建示例客户
    const customerExists = await db
      .select()
      .from(customers)
      .where(eq(customers.name, "示例科技有限公司"))
      .limit(1);

    let customerId: string | undefined;
    if (customerExists.length === 0) {
      await db.insert(customers).values({
        name: "示例科技有限公司",
        contactPerson: "王总",
        contactPhone: "13900139000",
        email: "contact@example.com",
        address: "北京市朝阳区",
        salesId: salesId || null,
        status: "cooperative",
      });
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.name, "示例科技有限公司"))
        .limit(1);
      customerId = customer[0]?.id;
      results.customer = customer[0];
    } else {
      customerId = customerExists[0]?.id;
      results.customer = customerExists[0];
    }

    // 6. 创建示例账套
    if (customerId && accountantId) {
      const ledgerExists = await db
        .select()
        .from(ledgers)
        .where(eq(ledgers.name, "2024年度税务申报"))
        .limit(1);

      if (ledgerExists.length === 0) {
        await db.insert(ledgers).values({
          name: "2024年度税务申报",
          customerId: customerId,
          accountantId: accountantId,
          year: 2024,
          status: "active",
          description: "2024年度税务申报账套",
        });
        const ledger = await db
          .select()
          .from(ledgers)
          .where(eq(ledgers.name, "2024年度税务申报"))
          .limit(1);
        results.ledger = ledger[0];
      } else {
        results.ledger = ledgerExists[0];
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
