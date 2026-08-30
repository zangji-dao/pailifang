/**
 * OnlyOffice 回调 API
 * 处理文档保存回调
 * 
 * OnlyOffice 回调类型：
 * - 0: 文档正在编辑（首次打开时触发）
 * - 1: 文档正在编辑，保存中（自动保存）
 * - 2: 文档准备保存（用户关闭编辑器或强制保存）
 * - 3: 文档保存错误
 * - 4: 文档关闭且未修改
 * - 6: 文档正在编辑，强制保存中
 * - 7: 强制保存错误
 */
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/database/server";

const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "";
const JWT_ENABLED = process.env.ONLYOFFICE_JWT_ENABLED === "true";

interface CallbackBody {
  key: string;
  status: number;
  url?: string;
  changesurl?: string;
  history?: {
    serverVersion: string;
    changes: Array<{
      created: string;
      user: { id: string; name: string };
    }>;
  };
  users?: string[];
  actions?: Array<{
    type: number;
    userid: string;
  }>;
  lastsave?: string;
  notmodified?: boolean;
  forcesavetype?: number;
  token?: string;
}

/**
 * 从回调 URL 的查询参数中提取模板信息
 * callbackUrl 格式: /api/onlyoffice/callback?templateId=xxx&docIndex=0&storagePath=xxx
 */
function extractTemplateInfo(request: NextRequest): {
  templateId: string | null;
  docIndex: number;
  storagePath: string | null;
} {
  const url = request.url;
  try {
    const parsedUrl = new URL(url);
    return {
      templateId: parsedUrl.searchParams.get("templateId"),
      docIndex: parseInt(parsedUrl.searchParams.get("docIndex") || "0", 10),
      storagePath: parsedUrl.searchParams.get("storagePath"),
    };
  } catch {
    return { templateId: null, docIndex: 0, storagePath: null };
  }
}

/**
 * 从 OnlyOffice URL 下载文档并保存到 Supabase 存储
 */
async function downloadAndSaveToStorage(
  downloadUrl: string,
  templateId: string,
  docIndex: number,
  storagePath?: string | null
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log(`[OnlyOffice Callback] 下载文档: ${downloadUrl}`);
    console.log(`[OnlyOffice Callback] 模板ID: ${templateId}, 文档索引: ${docIndex}, 存储路径: ${storagePath}`);

    // 从 OnlyOffice 下载文档
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`下载文档失败: HTTP ${downloadResponse.status}`);
    }

    const documentBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    console.log(`[OnlyOffice Callback] 文档大小: ${documentBuffer.length} bytes`);

    // 确定存储路径
    const targetPath = storagePath || `contract-templates/${templateId}/main.docx`;

    // 上传到后端 COS 存储
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";
    const uploadFormData = new FormData();
    const blob = new Blob([new Uint8Array(documentBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    uploadFormData.append("file", blob, "main.docx");
    uploadFormData.append("type", "contract");
    uploadFormData.append("key", targetPath);

    const uploadResponse = await fetch(`${backendUrl}/api/storage/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      console.error("[OnlyOffice Callback] 上传到 COS 失败:", uploadResult.error);
      throw new Error(`上传失败: ${uploadResult.error}`);
    }

    const savedUrl = uploadResult.data.url;
    console.log(`[OnlyOffice Callback] 文档已保存到 COS: ${targetPath}`);

    // 更新数据库中的模板记录（仅主文档）
    if (docIndex === 0 && templateId) {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("contract_templates")
        .update({
          source_file_url: savedUrl,
          storage_key: targetPath,
          updated_at: now,
        })
        .eq("id", templateId);

      if (updateError) {
        console.error("[OnlyOffice Callback] 更新模板记录失败:", updateError);
        // 不抛出异常，文件已保存成功
      } else {
        console.log("[OnlyOffice Callback] 模板记录已更新");
      }
    }

    return { success: true, url: savedUrl };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[OnlyOffice Callback] 下载并保存文档失败:", errMsg);
    return { success: false, error: errMsg };
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: CallbackBody;
    let token: string | undefined;

    // 提取模板信息（从回调 URL 的查询参数）
    const { templateId, docIndex, storagePath } = extractTemplateInfo(request);

    // 如果启用了 JWT，验证 token
    if (JWT_ENABLED && JWT_SECRET) {
      const authHeader = request.headers.get("authorization");

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token) {
        const bodyText = await request.text();
        let bodyJson: Record<string, unknown>;

        try {
          bodyJson = JSON.parse(bodyText);
        } catch {
          console.error("[OnlyOffice Callback] Invalid JSON body");
          return NextResponse.json({ error: 1 }, { status: 400 });
        }

        if (typeof bodyJson.token === "string") {
          token = bodyJson.token;
        }

        delete bodyJson.token;
        body = bodyJson as unknown as CallbackBody;
      } else {
        body = await request.json();
      }

      if (!token) {
        console.warn("[OnlyOffice Callback] No token provided, but JWT is enabled");
      } else {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
          console.log("[OnlyOffice Callback] Token verified successfully");
          console.log("[OnlyOffice Callback] Decoded payload:", JSON.stringify(decoded));
        } catch (err) {
          console.error("[OnlyOffice Callback] Token verification failed:", err);
        }
      }
    } else {
      body = await request.json();
    }

    const { key, status, url } = body;

    console.log(`[OnlyOffice Callback] Key: ${key}, Status: ${status}, TemplateId: ${templateId}, DocIndex: ${docIndex}`);

    switch (status) {
      case 0:
        // 文档首次打开，无操作
        break;

      case 1:
        // 文档正在编辑，保存中
        console.log(`[OnlyOffice] Document ${key} is being saved`);
        break;

      case 2: {
        // 文档准备保存（用户关闭编辑器或手动保存）
        if (url && templateId) {
          console.log(`[OnlyOffice] Document ${key} saving, URL: ${url}`);
          // 异步下载并保存到 Supabase 存储
          downloadAndSaveToStorage(url, templateId, docIndex, storagePath)
            .then((result) => {
              if (result.success) {
                console.log(`[OnlyOffice] Document ${key} saved to storage: ${result.url}`);
              } else {
                console.error(`[OnlyOffice] Failed to save document ${key}: ${result.error}`);
              }
            })
            .catch((err) => {
              console.error(`[OnlyOffice] Error saving document ${key}:`, err);
            });
        } else if (url) {
          console.warn(`[OnlyOffice] Document ${key} saved but no templateId, URL: ${url}`);
        }
        break;
      }

      case 3:
        // 文档保存错误
        console.error(`[OnlyOffice] Document ${key} save error`);
        break;

      case 4:
        // 文档关闭且未修改
        console.log(`[OnlyOffice] Document ${key} closed without changes`);
        break;

      case 6: {
        // 强制保存（自动保存触发）
        if (url && templateId) {
          console.log(`[OnlyOffice] Document ${key} force saving, URL: ${url}`);
          // 异步下载并保存到 Supabase 存储
          downloadAndSaveToStorage(url, templateId, docIndex, storagePath)
            .then((result) => {
              if (result.success) {
                console.log(`[OnlyOffice] Document ${key} force saved to storage: ${result.url}`);
              } else {
                console.error(`[OnlyOffice] Failed to force save document ${key}: ${result.error}`);
              }
            })
            .catch((err) => {
              console.error(`[OnlyOffice] Error force saving document ${key}:`, err);
            });
        } else if (url) {
          console.warn(`[OnlyOffice] Document ${key} force saved but no templateId, URL: ${url}`);
        }
        break;
      }

      case 7:
        // 强制保存错误
        console.error(`[OnlyOffice] Document ${key} force save error`);
        break;

      default:
        console.warn(`[OnlyOffice] Unknown status: ${status}`);
    }

    // 必须返回 {"error": 0} 表示成功
    return NextResponse.json({ error: 0 });
  } catch (error) {
    console.error("[OnlyOffice Callback Error]:", error);
    return NextResponse.json({ error: 1 }, { status: 500 });
  }
}

// 获取已保存的文档 URL（调试用）
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "缺少参数: key" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "文档保存信息请查看日志，文档已通过回调自动保存到 Supabase 存储",
  });
}
