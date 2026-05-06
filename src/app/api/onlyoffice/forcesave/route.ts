/**
 * OnlyOffice 强制保存 API
 * 向 OnlyOffice 服务器发送 forcesave 命令，触发文档立即保存
 */
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || "http://localhost:8080";
const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "";
const JWT_ENABLED = process.env.ONLYOFFICE_JWT_ENABLED === "true";

interface ForceSaveRequest {
  key: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForceSaveRequest = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "缺少必要参数: key" },
        { status: 400 }
      );
    }

    // 构建 forcesave 命令
    const command = {
      c: "forcesave",
      key,
    };

    // 如果启用了 JWT，签名命令
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (JWT_ENABLED && JWT_SECRET) {
      const token = jwt.sign(command, JWT_SECRET, { algorithm: "HS256" });
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`[OnlyOffice ForceSave] Sending forcesave command for key: ${key}`);

    // 向 OnlyOffice 服务器发送 forcesave 命令
    const commandUrl = `${ONLYOFFICE_URL}/coauthoring/CommandService.ashx`;
    const response = await fetch(commandUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.error(`[OnlyOffice ForceSave] Command failed: HTTP ${response.status}`);
      return NextResponse.json(
        { error: `OnlyOffice 命令失败: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log(`[OnlyOffice ForceSave] Command result:`, JSON.stringify(result));

    // OnlyOffice 返回格式: { error: 0 } 表示成功
    if (result.error !== undefined && result.error !== 0) {
      return NextResponse.json(
        { error: `OnlyOffice forcesave 失败: error ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "强制保存命令已发送",
    });
  } catch (error) {
    console.error("[OnlyOffice ForceSave Error]:", error);
    return NextResponse.json(
      { error: "强制保存失败" },
      { status: 500 }
    );
  }
}
