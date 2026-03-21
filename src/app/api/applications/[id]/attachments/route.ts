import { NextRequest, NextResponse } from "next/server";
import { S3Storage } from "coze-coding-dev-sdk";

/**
 * POST /api/applications/[id]/attachments
 * 上传申请附件
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "请选择要上传的文件" }, { status: 400 });
    }

    // 初始化存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });

    // 上传文件
    const uploadedFiles: { name: string; key: string; url: string }[] = [];
    
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `applications/${id}/attachments/${Date.now()}_${file.name}`;
      
      const key = await storage.uploadFile({
        fileContent: buffer,
        fileName,
        contentType: file.type || "application/octet-stream",
      });
      
      // 生成访问 URL（有效期 30 天）
      const url = await storage.generatePresignedUrl({
        key,
        expireTime: 2592000,
      });
      
      uploadedFiles.push({
        name: file.name,
        key,
        url,
      });
    }

    // 更新数据库，添加附件
    const { getSupabaseClient } = await import("@/storage/database/supabase-client");
    const client = getSupabaseClient();
    
    // 先获取现有附件
    const { data: existing } = await client
      .from("pi_settlement_applications")
      .select("attachments")
      .eq("id", id)
      .single();
    
    const existingAttachments = existing?.attachments || [];
    const newAttachments = [
      ...existingAttachments,
      ...uploadedFiles.map((f) => ({
        name: f.name,
        url: f.key, // 存储 key，使用时再生成 URL
        type: "image",
        uploadedAt: new Date().toISOString(),
      })),
    ];
    
    // 更新附件列表
    const { error } = await client
      .from("pi_settlement_applications")
      .update({ attachments: newAttachments })
      .eq("id", id);
    
    if (error) {
      console.error("更新附件失败:", error);
      return NextResponse.json({ error: "更新附件失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles.map((f) => ({
        name: f.name,
        key: f.key,
        url: f.url,
      })),
    });
  } catch (error) {
    console.error("上传附件失败:", error);
    return NextResponse.json({ error: "上传附件失败" }, { status: 500 });
  }
}

/**
 * GET /api/applications/[id]/attachments
 * 获取申请附件列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getSupabaseClient } = await import("@/storage/database/supabase-client");
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from("pi_settlement_applications")
      .select("attachments")
      .eq("id", id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: "获取附件失败" }, { status: 500 });
    }
    
    const attachments = data?.attachments || [];
    
    // 如果有附件，生成访问 URL
    if (attachments.length > 0) {
      const storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: "",
        secretKey: "",
        bucketName: process.env.COZE_BUCKET_NAME,
        region: "cn-beijing",
      });
      
      for (const attachment of attachments) {
        if (attachment.url && !attachment.url.startsWith("http")) {
          attachment.url = await storage.generatePresignedUrl({
            key: attachment.url,
            expireTime: 86400,
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error("获取附件失败:", error);
    return NextResponse.json({ error: "获取附件失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/applications/[id]/attachments
 * 删除申请附件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: "缺少文件标识" }, { status: 400 });
    }
    
    // 删除存储中的文件
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });
    
    await storage.deleteFile({ fileKey: key });
    
    // 从数据库中移除附件记录
    const { getSupabaseClient } = await import("@/storage/database/supabase-client");
    const client = getSupabaseClient();
    
    const { data: existing } = await client
      .from("pi_settlement_applications")
      .select("attachments")
      .eq("id", id)
      .single();
    
    const existingAttachments = existing?.attachments || [];
    const newAttachments = existingAttachments.filter(
      (a: { url: string }) => a.url !== key
    );
    
    await client
      .from("pi_settlement_applications")
      .update({ attachments: newAttachments })
      .eq("id", id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除附件失败:", error);
    return NextResponse.json({ error: "删除附件失败" }, { status: 500 });
  }
}
