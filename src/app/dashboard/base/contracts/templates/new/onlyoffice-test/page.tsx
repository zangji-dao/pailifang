/**
 * OnlyOffice 编辑器测试页面
 * 用于验证 OnlyOffice 集成是否正常工作
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

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
    customization: Record<string, unknown>;
    documentServerUrl?: string;
  };
  type: string;
  width: string;
  height: string;
  token?: string;
}

export default function OnlyOfficeTestPage() {
  const [config, setConfig] = useState({
    documentId: "test-doc-001",
    title: "测试合同模板.docx",
    documentUrl: "",
    fileType: "docx",
  });
  const [editorConfig, setEditorConfig] = useState<EditorConfig | null>(null);
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取编辑器配置
  const handleGetConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEditorConfig(null);

    try {
      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取配置失败");
      }

      setEditorConfig(data.config);
      setServerUrl(data.serverUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取配置失败");
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // 上传测试文件
  const handleUploadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", config.documentId);

      const response = await fetch("/api/onlyoffice/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "上传失败");
      }

      setConfig((prev) => ({
        ...prev,
        documentUrl: data.url,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsLoading(false);
    }
  }, [config.documentId]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OnlyOffice 编辑器测试</h1>
        <p className="text-muted-foreground">
          测试 OnlyOffice Document Server 集成
        </p>
      </div>

      {/* 配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>编辑器配置</CardTitle>
          <CardDescription>
            配置 OnlyOffice 编辑器参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentId">文档 ID</Label>
              <Input
                id="documentId"
                value={config.documentId}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, documentId: e.target.value }))
                }
                placeholder="test-doc-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">文档标题</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="合同模板.docx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentUrl">文档 URL</Label>
            <div className="flex gap-2">
              <Input
                id="documentUrl"
                value={config.documentUrl}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, documentUrl: e.target.value }))
                }
                placeholder="OnlyOffice 服务可访问的文档 URL"
                className="flex-1"
              />
              <div className="flex items-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isLoading}
                >
                  上传文件
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              输入 OnlyOffice 服务可以访问的文档 URL，或上传本地文件
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGetConfig}
            disabled={isLoading || !config.documentUrl}
          >
            {isLoading ? "加载中..." : "生成配置并加载编辑器"}
          </Button>
        </CardContent>
      </Card>

      {/* 部署状态提示 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>重要：</strong>使用前请确保已部署 OnlyOffice Document Server。
          请参考{" "}
          <a
            href="/docs/ONLYOFFICE_DEPLOYMENT.md"
            target="_blank"
            className="underline inline-flex items-center gap-1"
          >
            部署文档
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* 编辑器配置预览 */}
      {editorConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              编辑器配置已生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  OnlyOffice 服务地址
                </Label>
                <p className="font-mono text-sm mt-1">
                  {serverUrl}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  JWT Token
                </Label>
                <p className="font-mono text-xs mt-1 break-all">
                  {editorConfig.token ? "已生成 (长度: " + editorConfig.token.length + ")" : "未生成"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  编辑器配置（JSON）
                </Label>
                <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-xs">
                  {JSON.stringify(editorConfig, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑器区域 */}
      {editorConfig && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[600px]">
              <OnlyOfficeEditor
                documentId={config.documentId}
                title={config.title}
                documentUrl={config.documentUrl}
                fileType={config.fileType}
                callbackUrl={editorConfig.editorConfig.callbackUrl}
                serverUrl={serverUrl}
                token={editorConfig.token}
                onReady={() => console.log("Editor ready")}
                onError={(err) => setError(err.message)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>确保 OnlyOffice Document Server 已部署并运行</li>
            <li>设置环境变量 ONLYOFFICE_URL 指向服务器地址</li>
            <li>如果启用了 JWT，设置 ONLYOFFICE_JWT_SECRET</li>
            <li>上传一个 .docx 文件或输入文档 URL</li>
            <li>点击"生成配置并加载编辑器"</li>
          </ol>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">环境变量示例：</h4>
            <pre className="p-4 bg-muted rounded-lg text-xs">
              {`ONLYOFFICE_URL=http://localhost:8080
ONLYOFFICE_JWT_ENABLED=true
ONLYOFFICE_JWT_SECRET=your_secret_key`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
