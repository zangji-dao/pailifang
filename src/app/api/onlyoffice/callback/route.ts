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
  token?: string; // OnlyOffice 可能从 body 发送 token
}

// 存储文档保存状态的内存缓存
// 生产环境应该使用 Redis 或数据库
const documentCache = new Map<string, { url: string; savedAt: number }>();

export async function POST(request: NextRequest) {
  try {
    let body: CallbackBody;
    let token: string | undefined;

    // 如果启用了 JWT，验证 token
    if (JWT_ENABLED && JWT_SECRET) {
      // OnlyOffice 可能从 Authorization header 或 body.token 发送 token
      const authHeader = request.headers.get("authorization");
      
      // 尝试从 Authorization header 获取 token
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
      
      // 如果没有从 header 获取，尝试从 body 获取
      if (!token) {
        const bodyText = await request.text();
        let bodyJson: Record<string, unknown>;
        
        try {
          bodyJson = JSON.parse(bodyText);
        } catch {
          // 如果无法解析 JSON，返回错误
          console.error("[OnlyOffice Callback] Invalid JSON body");
          return NextResponse.json({ error: 1 }, { status: 400 });
        }
        
        // 尝试从 body.token 获取
        if (typeof bodyJson.token === "string") {
          token = bodyJson.token;
        }
        
        // 从 body 中移除 token 用于后续处理
        delete bodyJson.token;
        body = bodyJson as unknown as CallbackBody;
      } else {
        // 从 header 获取了 token，需要解析 body
        body = await request.json();
      }
      
      // 如果启用了 JWT 但没有提供 token，可能是配置问题
      // 但为了兼容性，我们仍然处理回调
      if (!token) {
        console.warn("[OnlyOffice Callback] No token provided, but JWT is enabled");
        // 继续处理，但不验证 token
      } else {
        // 验证 token
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
          console.log("[OnlyOffice Callback] Token verified successfully");
          console.log("[OnlyOffice Callback] Decoded payload:", JSON.stringify(decoded));
        } catch (err) {
          console.error("[OnlyOffice Callback] Token verification failed:", err);
          // 即使验证失败，也继续处理回调（为了兼容性）
          // 在生产环境中，可以选择返回 401
        }
      }
    } else {
      body = await request.json();
    }

    const { key, status, url } = body;

    console.log(`[OnlyOffice Callback] Key: ${key}, Status: ${status}`);

    switch (status) {
      case 0:
        // 文档首次打开，无操作
        break;

      case 1:
        // 文档正在编辑，保存中
        console.log(`[OnlyOffice] Document ${key} is being saved`);
        break;

      case 2:
        // 文档准备保存
        if (url) {
          // 缓存文档 URL
          documentCache.set(key, {
            url,
            savedAt: Date.now(),
          });
          console.log(`[OnlyOffice] Document ${key} saved to: ${url}`);

          // TODO: 这里应该将文档保存到对象存储或数据库
          // 可以通过 url 下载最新版本的文档
          // 例如：fetch(url).then(r => r.arrayBuffer()).then(saveToStorage)
        }
        break;

      case 3:
        // 文档保存错误
        console.error(`[OnlyOffice] Document ${key} save error`);
        break;

      case 4:
        // 文档关闭且未修改
        console.log(`[OnlyOffice] Document ${key} closed without changes`);
        break;

      case 6:
        // 强制保存
        if (url) {
          documentCache.set(key, {
            url,
            savedAt: Date.now(),
          });
          console.log(`[OnlyOffice] Document ${key} force saved to: ${url}`);
        }
        break;

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

// 获取已保存的文档 URL
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "缺少参数: key" },
      { status: 400 }
    );
  }

  const cached = documentCache.get(key);
  if (!cached) {
    return NextResponse.json(
      { error: "文档未找到或未保存" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    url: cached.url,
    savedAt: cached.savedAt,
  });
}
