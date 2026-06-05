/**
 * OnlyOffice 文件上传 API
 * 用于上传模板文件并获取可访问的 URL
 */
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4001";

export async function POST(request: NextRequest) {
  try {
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
    const storageKey = `contract-templates/${templateId}/${nanoid()}.${fileExt}`;

    // 上传到后端 COS 存储
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadFormData = new FormData();
    const blob = new Blob([buffer], {
      type: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    uploadFormData.append("file", blob, file.name);
    uploadFormData.append("type", "contract");
    uploadFormData.append("key", storageKey);

    const uploadResponse = await fetch(`${BACKEND_URL}/api/storage/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      console.error("Upload error:", uploadResult.error);
      return NextResponse.json(
        { error: "文件上传失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: storageKey,
      url: uploadResult.data.url,
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
    // 从后端获取签名下载 URL
    const response = await fetch(
      `${BACKEND_URL}/api/storage/files/${encodeURIComponent(path)}?expiresIn=3600`
    );
    const result = await response.json();

    if (!result.success) {
      console.error("Get signed URL error:", result.error);
      return NextResponse.json(
        { error: "获取文件 URL 失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.data.url,
    });
  } catch (error) {
    console.error("Get signed URL error:", error);
    return NextResponse.json(
      { error: "获取文件 URL 失败" },
      { status: 500 }
    );
  }
}
