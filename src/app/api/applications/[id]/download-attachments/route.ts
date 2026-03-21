import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { S3Storage } from "coze-coding-dev-sdk";

/**
 * GET /api/applications/[id]/download-attachments
 * 打包下载申请的所有附件
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 获取申请详情
    const { data: application, error } = await client
      .from("pi_settlement_applications")
      .select("id, application_no, enterprise_name, shareholders, personnel, attachments")
      .eq("id", id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    // 收集所有附件
    const files: { name: string; url: string }[] = [];

    // 1. 从股东信息中收集身份证图片
    const shareholders = application.shareholders as Array<{
      name?: string;
      idCardFrontUrl?: string;
      idCardFrontKey?: string;
      idCardBackUrl?: string;
      idCardBackKey?: string;
    }> | null;

    if (shareholders && Array.isArray(shareholders)) {
      shareholders.forEach((sh, idx) => {
        const prefix = `股东/${sh.name || `股东${idx + 1}`}`;
        const frontUrl = sh.idCardFrontKey || sh.idCardFrontUrl;
        const backUrl = sh.idCardBackKey || sh.idCardBackUrl;
        if (frontUrl) {
          files.push({
            name: `${prefix}/身份证正面.jpg`,
            url: frontUrl,
          });
        }
        if (backUrl) {
          files.push({
            name: `${prefix}/身份证反面.jpg`,
            url: backUrl,
          });
        }
      });
    }

    // 2. 从人员信息中收集身份证图片
    const personnel = application.personnel as Array<{
      name?: string;
      roles?: string[];
      idCardFrontUrl?: string;
      idCardFrontKey?: string;
      idCardBackUrl?: string;
      idCardBackKey?: string;
    }> | null;

    if (personnel && Array.isArray(personnel)) {
      const roleNames: Record<string, string> = {
        legal_person: "法人代表",
        supervisor: "监事",
        finance_manager: "财务负责人",
      };

      personnel.forEach((p, idx) => {
        const roleName = p.roles?.map((r) => roleNames[r] || r).join("-") || `人员${idx + 1}`;
        const prefix = `人员/${p.name || "未知"}_${roleName}`;
        const frontUrl = p.idCardFrontKey || p.idCardFrontUrl;
        const backUrl = p.idCardBackKey || p.idCardBackUrl;
        if (frontUrl) {
          files.push({
            name: `${prefix}/身份证正面.jpg`,
            url: frontUrl,
          });
        }
        if (backUrl) {
          files.push({
            name: `${prefix}/身份证反面.jpg`,
            url: backUrl,
          });
        }
      });
    }

    // 3. 从附件列表收集审批附件
    const attachments = application.attachments as Array<{
      name?: string;
      url?: string;
    }> | null;

    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att, idx) => {
        if (att.url) {
          files.push({
            name: `审批附件/${att.name || `附件${idx + 1}`}`,
            url: att.url,
          });
        }
      });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "没有可下载的附件" }, { status: 400 });
    }

    // 初始化存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });

    // 动态导入 archiver 用于打包
    const archiver = (await import("archiver")).default;

    // 创建 zip 流
    const archive = archiver("zip", {
      zlib: { level: 9 }, // 压缩级别
    });

    // 下载所有文件并添加到 zip
    for (const file of files) {
      try {
        let fileUrl = file.url;

        // 如果是存储 key（不以 http 开头），生成签名 URL
        if (!fileUrl.startsWith("http")) {
          fileUrl = await storage.generatePresignedUrl({
            key: fileUrl,
            expireTime: 3600,
          });
        }

        console.log(`下载文件: ${file.name}, URL: ${fileUrl.substring(0, 100)}...`);

        // 下载文件
        const response = await fetch(fileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          console.log(`下载成功: ${file.name}, 大小: ${buffer.length} bytes`);
          archive.append(buffer, { name: file.name });
        } else {
          console.error(`下载失败: ${file.name}, HTTP ${response.status}`);
        }
      } catch (err) {
        console.error(`下载文件失败: ${file.name}`, err);
        // 继续处理其他文件
      }
    }

    // 完成 zip 打包
    archive.finalize();

    // 将 zip 流转换为 Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of archive) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);

    // 生成文件名
    const enterpriseName = application.enterprise_name || "企业申请";
    const applicationNo = application.application_no || id;
    const fileName = `${enterpriseName}_${applicationNo}_附件.zip`;

    // 返回 zip 文件
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("打包下载失败:", error);
    return NextResponse.json({ error: "打包下载失败" }, { status: 500 });
  }
}
