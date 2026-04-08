/**
 * OnlyOffice 编辑器配置 API
 * 返回编辑器初始化所需的配置信息
 */
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || "http://localhost:8080";
const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "";
const JWT_ENABLED = process.env.ONLYOFFICE_JWT_ENABLED === "true";

interface ConfigRequest {
  documentId: string;
  title: string;
  documentUrl: string;
  fileType?: string;
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
  };
  type: string;
  width: string;
  height: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigRequest = await request.json();
    const { documentId, title, documentUrl, fileType = "docx" } = body;

    if (!documentId || !documentUrl) {
      return NextResponse.json(
        { error: "缺少必要参数: documentId, documentUrl" },
        { status: 400 }
      );
    }

    // 生成文档 key（用于区分文档版本）
    // OnlyOffice 会根据 key 缓存文档，所以需要确保唯一性
    const documentKey = `${documentId}-${Date.now()}`;

    // 构建回调 URL - 使用公网地址供 OnlyOffice 云服务器回调
    // 本地开发使用 localhost，生产环境使用 COZE_PROJECT_DOMAIN_DEFAULT
    const publicUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT 
      ? process.env.COZE_PROJECT_DOMAIN_DEFAULT  // 直接使用域名，已包含协议
      : "http://localhost:5000";
    const callbackUrl = `${publicUrl}/api/onlyoffice/callback`;

    const config: EditorConfig = {
      document: {
        fileType,
        key: documentKey,
        title: title || "合同模板.docx",
        url: documentUrl,
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
        // documentServerUrl - 告诉编辑器从哪里加载资源
        documentServerUrl: ONLYOFFICE_URL,
      },
      type: "desktop",
      width: "100%",
      height: "100%",
    };

    // 如果启用了 JWT，生成 token
    // OnlyOffice JWT payload 只接受特定的字段
    if (JWT_ENABLED && JWT_SECRET) {
      const tokenPayload = {
        document: config.document,
        editorConfig: config.editorConfig,
        documentServerUrl: ONLYOFFICE_URL,
      };
      config.token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: "HS256" });
    }

    return NextResponse.json({
      success: true,
      config,
      serverUrl: ONLYOFFICE_URL,
    });
  } catch (error) {
    console.error("OnlyOffice config error:", error);
    return NextResponse.json(
      { error: "生成配置失败" },
      { status: 500 }
    );
  }
}
