/**
 * OnlyOffice 文件上传 API
 * 用于上传模板文件并获取可访问的 URL
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

const BUCKET_NAME = "contract-templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const templateId = formData.get("templateId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "未提供文件" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "缺少模板 ID" },
        { status: 400 }
      );
    }

    // 生成文件路径
    const fileExt = file.name.split(".").pop() || "docx";
    const fileName = `${templateId}/${nanoid()}.${fileExt}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: "文件上传失败" },
        { status: 500 }
      );
    }

    // 获取公开访问 URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "文件上传失败" },
      { status: 500 }
    );
  }
}

// 获取文件的签名 URL（用于 OnlyOffice 访问）
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "缺少参数: path" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();
    // 创建临时签名 URL（有效期 1 小时）
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("Get signed URL error:", error);
      return NextResponse.json(
        { error: "获取文件 URL 失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error) {
    console.error("Get signed URL error:", error);
    return NextResponse.json(
      { error: "获取文件 URL 失败" },
      { status: 500 }
    );
  }
}
