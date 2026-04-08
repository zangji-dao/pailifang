/**
 * OnlyOffice 编辑器测试页面
 * 用于验证 OnlyOffice 集成是否正常工作
 */
"use client";

import { useState, useCallback } from "react";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

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
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold">OnlyOffice 编辑器测试</h1>
        <p className="text-muted-foreground text-sm">
          测试 OnlyOffice Document Server 集成
        </p>
      </div>
      
      <div className="flex gap-4 h-[calc(100vh-160px)]">
        {/* 左侧：配置面板 */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">编辑器配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="documentId" className="text-xs">文档 ID</Label>
                <Input
                  id="documentId"
                  value={config.documentId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, documentId: e.target.value }))
                  }
                  placeholder="test-doc-001"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs">文档标题</Label>
                <Input
                  id="title"
                  value={config.title}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="合同模板.docx"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="documentUrl" className="text-xs">文档 URL</Label>
                <Input
                  id="documentUrl"
                  value={config.documentUrl}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, documentUrl: e.target.value }))
                  }
                  placeholder="文档 URL"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
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
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  上传文件
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                size="sm"
                onClick={handleGetConfig}
                disabled={isLoading || !config.documentUrl}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    加载中...
                  </>
                ) : (
                  "加载编辑器"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 状态信息 */}
          {editorConfig && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  配置已生成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">服务地址：</span>
                  <p className="font-mono break-all">{serverUrl}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">JWT：</span>
                  <span>{editorConfig.token ? `已生成 (${editorConfig.token.length}字符)` : "未生成"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert className="py-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>提示：</strong>确保 OnlyOffice 已部署。
              <a
                href="/docs/ONLYOFFICE_DEPLOYMENT.md"
                target="_blank"
                className="underline ml-1"
              >
                查看文档
                <ExternalLink className="h-3 w-3 inline ml-0.5" />
              </a>
            </AlertDescription>
          </Alert>
        </div>
        
        {/* 右侧：编辑器 */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-muted/20">
          {editorConfig ? (
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
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">请先配置文档 URL 并点击「加载编辑器」</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
