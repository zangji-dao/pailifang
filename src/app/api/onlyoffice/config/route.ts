/**
 * OnlyOffice 编辑器配置 API
 * 返回编辑器初始化所需的配置信息
 */
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || "http://localhost:8080";
const ONLYOFFICE_PUBLIC_URL = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || ONLYOFFICE_URL;
const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "";
const JWT_ENABLED = process.env.ONLYOFFICE_JWT_ENABLED === "true";

interface ConfigRequest {
  documentId: string;
  title: string;
  documentUrl: string;
  fileType?: string;
  templateId?: string;
  docIndex?: number;
  storagePath?: string;
}

interface EditorConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      edit: boolean;
      download: boolean;
      print: boolean;
      review: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    mode: string;
    callbackUrl: string;
    lang: string;
    user: {
      id: string;
      name: string;
    };
    customization: {
      autosave: boolean;
      chat: boolean;
      comments: boolean;
      compactHeader: boolean;
      compactToolbar: boolean;
      feedback: boolean;
      forcesave: boolean;
      help: boolean;
      hideRightMenu: boolean;
      hideRulers: boolean;
      reviewDisplay: string;
      showReviewChanges: boolean;
      spellcheck: boolean;
      toolbarNoTabs: boolean;
      unit: string;
      zoom: number;
    };
    plugins?: {
      autostart?: string[];
      pluginsData?: string[];
    };
  };
  type: string;
  width: string;
  height: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigRequest = await request.json();
    const {
      documentId,
      title,
      documentUrl,
      fileType = "docx",
      templateId,
      docIndex = 0,
      storagePath,
    } = body;

    if (!documentId || !documentUrl) {
      return NextResponse.json(
        { error: "缺少必要参数: documentId, documentUrl" },
        { status: 400 }
      );
    }

    // 生成文档 key（用于区分文档版本）
    const documentKey = `${documentId}-${Date.now()}`;

    // 构建公网基础 URL
    const rawDomain = process.env.APP_URL || "http://localhost:5000";
    const publicUrl = rawDomain.startsWith("http") ? rawDomain : `https://${rawDomain}`;

    // 如果有 storagePath，优先通过下载代理（确保 URL 不会过期）
    // COS 签名 URL 有过期时间，通过代理实时获取最新签名 URL
    // 本机地址必须走代理，确保 OnlyOffice 服务能够访问
    let proxyDocumentUrl = documentUrl;
    if (storagePath) {
      // 有 storageKey，使用下载代理获取实时签名 URL
      proxyDocumentUrl = `${publicUrl}/api/onlyoffice/download?storagePath=${encodeURIComponent(storagePath)}`;
    } else if (documentUrl.includes("localhost") || documentUrl.includes("127.0.0.1")) {
      // 内网地址，使用下载代理
      if (templateId) {
        proxyDocumentUrl = `${publicUrl}/api/onlyoffice/download?templateId=${encodeURIComponent(templateId)}`;
      } else {
        proxyDocumentUrl = `${publicUrl}/api/onlyoffice/download?url=${encodeURIComponent(documentUrl)}`;
      }
    }
    // COS 签名 URL（含 cos.ap-beijing.myqcloud.com）可直接访问，不走代理

    console.log(`[OnlyOffice Config] originalUrl: ${documentUrl.substring(0, 100)}...`);
    console.log(`[OnlyOffice Config] proxyUrl: ${proxyDocumentUrl.substring(0, 100)}...`);

    // 将模板信息附加到回调 URL 的查询参数中
    // 这样 callback API 就能知道该把文档保存到哪个模板
    const callbackParams = new URLSearchParams();
    if (templateId) {
      callbackParams.set("templateId", templateId);
    }
    callbackParams.set("docIndex", String(docIndex));
    if (storagePath) {
      callbackParams.set("storagePath", storagePath);
    }

    const callbackUrl = `${publicUrl}/api/onlyoffice/callback?${callbackParams.toString()}`;

    console.log(`[OnlyOffice Config] templateId: ${templateId}, docIndex: ${docIndex}, storagePath: ${storagePath}`);
    console.log(`[OnlyOffice Config] callbackUrl: ${callbackUrl}`);

    const config: EditorConfig = {
      document: {
        fileType,
        key: documentKey,
        title: title || "合同模板.docx",
        url: proxyDocumentUrl,
        permissions: {
          edit: true,
          download: true,
          print: true,
          review: true,
        },
      },
      documentType: "word",
      editorConfig: {
        mode: "edit",
        callbackUrl,
        lang: "zh-CN",
        user: {
          id: "user-1",
          name: "管理员",
        },
        customization: {
          autosave: true,
          chat: false,
          comments: true,
          compactHeader: false,
          compactToolbar: false,
          feedback: false,
          forcesave: true,
          help: false,
          hideRightMenu: false,
          hideRulers: false,
          reviewDisplay: "markup",
          showReviewChanges: false,
          spellcheck: true,
          toolbarNoTabs: false,
          unit: "cm",
          zoom: 100,
        },
        // 启用变量绑定插件
        plugins: {
          autostart: ["asc.{8D6E3F7A-1B2C-4D5E-8F9A-0B1C2D3E4F5A}"],
        },
      },
      type: "desktop",
      width: "100%",
      height: "100%",
    };

    // 如果启用了 JWT，生成 token
    if (JWT_ENABLED && JWT_SECRET) {
      const tokenPayload = {
        document: {
          fileType: config.document.fileType,
          key: config.document.key,
          title: config.document.title,
          url: config.document.url,
        },
        documentType: config.documentType,
        editorConfig: {
          callbackUrl: config.editorConfig.callbackUrl,
        },
      };
      config.token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: "HS256" });
    }

    return NextResponse.json({
      success: true,
      config,
      serverUrl: ONLYOFFICE_PUBLIC_URL,
    });
  } catch (error) {
    console.error("OnlyOffice config error:", error);
    return NextResponse.json(
      { error: "生成配置失败" },
      { status: 500 }
    );
  }
}
