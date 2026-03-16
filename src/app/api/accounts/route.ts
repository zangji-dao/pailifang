import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * 获取科目列表
 * GET /api/accounts?ledgerId=xxx&type=asset
 */
export async function GET(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);

    const ledgerId = searchParams.get("ledgerId");
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    let query = client.from("chart_of_accounts").select("*");

    if (ledgerId) {
      query = query.eq("ledger_id", ledgerId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (parentId !== null) {
      if (parentId === "null" || parentId === "") {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", parentId);
      }
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error } = await query.order("code", { ascending: true });

    if (error) {
      console.error("获取科目列表失败:", error);
      return NextResponse.json(
        { success: false, error: "获取科目列表失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("获取科目列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取科目列表失败" },
      { status: 500 }
    );
  }
}

/**
 * 创建科目
 * POST /api/accounts
 */
export async function POST(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await req.json();

    // 检查编码是否已存在
    const { data: existing } = await client
      .from("chart_of_accounts")
      .select("id")
      .eq("ledger_id", body.ledgerId)
      .eq("code", body.code)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "科目编码已存在" },
        { status: 400 }
      );
    }

    // 计算科目层级
    let level = 1;
    if (body.parentId) {
      const { data: parent } = await client
        .from("chart_of_accounts")
        .select("level")
        .eq("id", body.parentId)
        .single();

      if (parent) {
        level = parent.level + 1;

        // 更新父节点为非叶子节点
        await client
          .from("chart_of_accounts")
          .update({ is_leaf: false })
          .eq("id", body.parentId);
      }
    }

    const accountData = {
      ledger_id: body.ledgerId,
      code: body.code,
      name: body.name,
      parent_id: body.parentId || null,
      level,
      type: body.type,
      direction: body.direction,
      is_leaf: true,
      is_active: body.isActive ?? true,
      remark: body.remark || null,
    };

    const { data, error } = await client
      .from("chart_of_accounts")
      .insert(accountData)
      .select()
      .single();

    if (error) {
      console.error("创建科目失败:", error);
      return NextResponse.json(
        { success: false, error: "创建科目失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "创建科目成功",
    });
  } catch (error) {
    console.error("创建科目失败:", error);
    return NextResponse.json(
      { success: false, error: "创建科目失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新科目
 * PUT /api/accounts
 */
export async function PUT(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少科目ID" },
        { status: 400 }
      );
    }

    // 检查科目是否存在
    const { data: existing } = await client
      .from("chart_of_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "科目不存在" },
        { status: 404 }
      );
    }

    // 如果是系统预设科目（一级科目），只允许修改状态
    if (existing.level === 1) {
      const allowedUpdate: Record<string, unknown> = {};
      
      if (updateData.isActive !== undefined) {
        allowedUpdate.is_active = updateData.isActive;
      }
      if (updateData.remark !== undefined) {
        allowedUpdate.remark = updateData.remark;
      }
      allowedUpdate.updated_at = new Date().toISOString();

      const { data, error } = await client
        .from("chart_of_accounts")
        .update(allowedUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("更新科目失败:", error);
        return NextResponse.json(
          { success: false, error: "更新科目失败" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        message: "更新科目成功",
      });
    }

    // 明细科目可以修改更多信息
    const dataToUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.isActive !== undefined) dataToUpdate.is_active = updateData.isActive;
    if (updateData.remark !== undefined) dataToUpdate.remark = updateData.remark;

    const { data, error } = await client
      .from("chart_of_accounts")
      .update(dataToUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("更新科目失败:", error);
      return NextResponse.json(
        { success: false, error: "更新科目失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "更新科目成功",
    });
  } catch (error) {
    console.error("更新科目失败:", error);
    return NextResponse.json(
      { success: false, error: "更新科目失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除科目
 * DELETE /api/accounts?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少科目ID" },
        { status: 400 }
      );
    }

    // 检查科目是否存在
    const { data: existing } = await client
      .from("chart_of_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "科目不存在" },
        { status: 404 }
      );
    }

    // 一级科目不允许删除
    if (existing.level === 1) {
      return NextResponse.json(
        { success: false, error: "系统预设科目不允许删除" },
        { status: 400 }
      );
    }

    // 检查是否有下级科目
    const { data: children } = await client
      .from("chart_of_accounts")
      .select("id")
      .eq("parent_id", id);

    if (children && children.length > 0) {
      return NextResponse.json(
        { success: false, error: "存在下级科目，无法删除" },
        { status: 400 }
      );
    }

    const { error } = await client
      .from("chart_of_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("删除科目失败:", error);
      return NextResponse.json(
        { success: false, error: "删除科目失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除科目成功",
    });
  } catch (error) {
    console.error("删除科目失败:", error);
    return NextResponse.json(
      { success: false, error: "删除科目失败" },
      { status: 500 }
    );
  }
}
