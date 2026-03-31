import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * POST /api/contract-templates/confirm-attachments
 * 确认并保存附件拆分结果
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { templateId, attachments } = body;

    if (!templateId || !attachments || !Array.isArray(attachments)) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 先删除该模板的旧附件记录
    await supabase
      .from('contract_attachments')
      .delete()
      .eq('template_id', templateId);

    // 插入新的附件记录
    const attachmentsData = attachments.map((att: any, index: number) => ({
      id: att.id || randomUUID(),
      template_id: templateId,
      name: att.name,
      description: att.description || null,
      page_range: att.pageRange || `${att.startPage}-${att.endPage}`,
      auto_detected: att.autoDetected || false,
      required: att.required || false,
      order: index + 1,
    }));

    const { data, error } = await supabase
      .from('contract_attachments')
      .insert(attachmentsData)
      .select();

    if (error) {
      console.error('保存附件失败:', error);
      return NextResponse.json(
        { success: false, error: '保存附件失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('确认附件失败:', error);
    return NextResponse.json(
      { success: false, error: '确认附件失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contract-templates/confirm-attachments
 * 更新单个附件
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { attachmentId, ...updateData } = body;

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: '缺少附件ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_attachments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attachmentId)
      .select()
      .single();

    if (error) {
      console.error('更新附件失败:', error);
      return NextResponse.json(
        { success: false, error: '更新附件失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('更新附件失败:', error);
    return NextResponse.json(
      { success: false, error: '更新附件失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contract-templates/confirm-attachments
 * 删除附件
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: '缺少附件ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contract_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      console.error('删除附件失败:', error);
      return NextResponse.json(
        { success: false, error: '删除附件失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除附件失败:', error);
    return NextResponse.json(
      { success: false, error: '删除附件失败' },
      { status: 500 }
    );
  }
}
