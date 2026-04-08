/**
 * 文档代理 API
 * 解决 OnlyOffice 服务器无法访问外部网络的问题
 * 流程：OnlyOffice → 沙箱代理 API → Supabase Storage
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get("path");
    const url = request.nextUrl.searchParams.get("url");

    let documentUrl: string;
    let fileName = "document.docx";

    if (url) {
      // 直接使用提供的 URL
      documentUrl = url;
      fileName = url.split("/").pop() || "document.docx";
    } else if (path) {
      // 从 Supabase Storage 获取公开 URL
      const supabase = createClient();
      const { data } = supabase.storage
        .from("contract-templates")
        .getPublicUrl(path);
      documentUrl = data.publicUrl;
      fileName = path.split("/").pop() || "document.docx";
    } else {
      return NextResponse.json(
        { error: "缺少参数: path 或 url" },
        { status: 400 }
      );
    }

    console.log("[OnlyOffice Proxy] 代理文档:", documentUrl);

    // 下载文档
    const response = await fetch(documentUrl, {
      headers: {
        "User-Agent": "OnlyOffice-Proxy/1.0",
      },
    });

    if (!response.ok) {
      console.error("[OnlyOffice Proxy] 下载失败:", response.status, response.statusText);
      return NextResponse.json(
        { error: `下载文档失败: ${response.status}` },
        { status: response.status }
      );
    }

    // 获取文档内容
    const documentBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    console.log("[OnlyOffice Proxy] 下载成功, 大小:", documentBuffer.byteLength);

    // 返回文档，设置 CORS 头允许 OnlyOffice 访问
    return new NextResponse(documentBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": documentBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("[OnlyOffice Proxy] 错误:", error);
    return NextResponse.json(
      { error: "代理请求失败" },
      { status: 500 }
    );
  }
}

// 处理 OPTIONS 预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
