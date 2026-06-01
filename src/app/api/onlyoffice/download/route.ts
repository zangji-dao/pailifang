/**
 * OnlyOffice 文档下载代理 API
 * 供 OnlyOffice 服务器下载文档使用
 * 将 S3 内网地址的文档通过主站代理输出
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("storagePath");
    const templateId = searchParams.get("templateId");
    const directUrl = searchParams.get("url");

    if (!storagePath && !templateId && !directUrl) {
      return NextResponse.json(
        { error: "缺少 storagePath、templateId 或 url 参数" },
        { status: 400 }
      );
    }

    // 通过后端 API 获取文件内容
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

    let downloadUrl: string;
    if (directUrl) {
      // 直接使用传入的 URL
      downloadUrl = directUrl;
    } else if (storagePath) {
      // 通过后端 storage 接口获取签名 URL
      const signedUrlRes = await fetch(
        `${backendUrl}/api/storage/files/${encodeURIComponent(storagePath)}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!signedUrlRes.ok) {
        console.error(`[Download Proxy] 获取签名URL失败: ${signedUrlRes.status}`);
        return NextResponse.json(
          { error: "获取文件签名URL失败" },
          { status: 500 }
        );
      }

      const signedUrlData = await signedUrlRes.json();
      if (!signedUrlData.success || !signedUrlData.data?.url) {
        console.error("[Download Proxy] 签名URL响应异常:", signedUrlData);
        return NextResponse.json(
          { error: "获取文件签名URL失败" },
          { status: 500 }
        );
      }

      downloadUrl = signedUrlData.data.url;
    } else {
      // 通过 templateId 获取模板的源文件
      const templateRes = await fetch(
        `${backendUrl}/api/contract-templates/${templateId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!templateRes.ok) {
        console.error(`[Download Proxy] 获取模板失败: ${templateRes.status}`);
        return NextResponse.json(
          { error: "获取模板信息失败" },
          { status: 500 }
        );
      }

      const templateData = await templateRes.json();
      const sourceFileUrl =
        templateData.data?.source_file_url || templateData.data?.file_url;

      if (!sourceFileUrl) {
        return NextResponse.json(
          { error: "模板没有关联的文档文件" },
          { status: 404 }
        );
      }

      downloadUrl = sourceFileUrl;
    }

    // 下载文件内容
    console.log(`[Download Proxy] 下载文件: ${downloadUrl.substring(0, 100)}...`);
    const fileRes = await fetch(downloadUrl);

    if (!fileRes.ok) {
      console.error(`[Download Proxy] 下载文件失败: ${fileRes.status}`);
      return NextResponse.json(
        { error: `下载文件失败: ${fileRes.status}` },
        { status: 502 }
      );
    }

    const contentType =
      fileRes.headers.get("content-type") ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const contentLength = fileRes.headers.get("content-length");

    // 流式转发文件内容
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": 'attachment; filename="document.docx"',
      "Cache-Control": "no-cache",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(fileRes.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "下载代理失败";
    console.error("[Download Proxy] 错误:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
