import { Request, Response } from 'express';
import { db, industries, eq } from '../database/client';

// 获取所有行业列表
export async function getIndustries(req: Request, res: Response) {
  try {
    const result = await db
      .select()
      .from(industries)
      .where(eq(industries.isActive, true))
      .orderBy(industries.sortOrder, industries.name);

    res.json({
      success: true,
      data: result.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error) {
    console.error('获取行业列表失败:', error);
    res.status(500).json({ success: false, error: '获取行业列表失败' });
  }
}

// 获取单个行业
export async function getIndustryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await db
      .select()
      .from(industries)
      .where(eq(industries.id, id));

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: '行业不存在' });
    }

    const item = result[0];
    res.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    console.error('获取行业详情失败:', error);
    res.status(500).json({ success: false, error: '获取行业详情失败' });
  }
}

// 创建行业
export async function createIndustry(req: Request, res: Response) {
  try {
    const { name, description, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '行业名称不能为空' });
    }

    // 检查名称是否已存在
    const existing = await db
      .select()
      .from(industries)
      .where(eq(industries.name, name.trim()));

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '行业名称已存在' });
    }

    const result = await db
      .insert(industries)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        id: result[0].id,
        name: result[0].name,
        description: result[0].description,
        sortOrder: result[0].sortOrder,
        isActive: result[0].isActive,
        createdAt: result[0].createdAt,
      },
    });
  } catch (error) {
    console.error('创建行业失败:', error);
    res.status(500).json({ success: false, error: '创建行业失败' });
  }
}

// 更新行业
export async function updateIndustry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    // 检查行业是否存在
    const existing = await db
      .select()
      .from(industries)
      .where(eq(industries.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '行业不存在' });
    }

    // 如果修改了名称，检查新名称是否已存在
    if (name && name.trim() !== existing[0].name) {
      const duplicate = await db
        .select()
        .from(industries)
        .where(eq(industries.name, name.trim()));

      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, error: '行业名称已存在' });
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await db
      .update(industries)
      .set(updateData)
      .where(eq(industries.id, id))
      .returning();

    res.json({
      success: true,
      data: {
        id: result[0].id,
        name: result[0].name,
        description: result[0].description,
        sortOrder: result[0].sortOrder,
        isActive: result[0].isActive,
        createdAt: result[0].createdAt,
        updatedAt: result[0].updatedAt,
      },
    });
  } catch (error) {
    console.error('更新行业失败:', error);
    res.status(500).json({ success: false, error: '更新行业失败' });
  }
}

// 删除行业（软删除）
export async function deleteIndustry(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 检查行业是否存在
    const existing = await db
      .select()
      .from(industries)
      .where(eq(industries.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '行业不存在' });
    }

    // 软删除
    await db
      .update(industries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(industries.id, id));

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除行业失败:', error);
    res.status(500).json({ success: false, error: '删除行业失败' });
  }
}

// 批量更新排序
export async function updateIndustriesOrder(req: Request, res: Response) {
  try {
    const { items } = req.body; // [{ id, sortOrder }, ...]

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: '参数格式错误' });
    }

    for (const item of items) {
      await db
        .update(industries)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(industries.id, item.id));
    }

    res.json({ success: true, message: '排序更新成功' });
  } catch (error) {
    console.error('更新排序失败:', error);
    res.status(500).json({ success: false, error: '更新排序失败' });
  }
}
