"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, Code, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DebugData {
  id: string;
  name: string;
  status: string;
  type: string;
  source_file_url: string;
  source_file_name: string;
  hasDraftData: boolean;
  draftDataInfo: {
    currentStep: number;
    editedHtmlLength: number;
    originalHtmlLength: number;
    markersCount: number;
    selectedVariablesCount: number;
    attachmentsCount: number;
  } | null;
  htmlFragments: {
    source: string;
    length: number;
    preview: string;
  }[];
  sealAreaMatches: {
    pattern: string;
    matches: string[];
  }[];
}

export default function ContractTemplateDebugPage() {
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DebugData | null>(null);
  const [debugHtml, setDebugHtml] = useState<string | null>(null);

  const fetchDebugData = async () => {
    if (!templateId.trim()) {
      setError("请输入模板 ID");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setDebugHtml(null);

    try {
      const response = await fetch(`/api/contract-templates/debug/${templateId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "获取调试信息失败");
        return;
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const exportDebugHtml = async () => {
    if (!templateId.trim()) {
      setError("请输入模板 ID");
      return;
    }

    setExporting(true);
    setError(null);
    setDebugHtml(null);

    try {
      const response = await fetch("/api/contract-templates/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, debug: true }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "导出调试 HTML 失败");
        return;
      }

      const html = await response.text();
      setDebugHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            合同模板调试工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="templateId">模板 ID</Label>
              <Input
                id="templateId"
                placeholder="输入模板 ID (UUID 格式)"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchDebugData} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                查询
              </Button>
              <Button variant="outline" onClick={exportDebugHtml} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                导出调试 HTML
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {data && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="html">HTML 片段</TabsTrigger>
            <TabsTrigger value="seal">签章区域</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>模板信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">模板名称</Label>
                    <p className="font-medium">{data.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">状态</Label>
                    <p>
                      <Badge variant={data.status === "draft" ? "secondary" : "default"}>
                        {data.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">类型</Label>
                    <p className="font-medium">{data.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">是否有草稿数据</Label>
                    <p>
                      <Badge variant={data.hasDraftData ? "default" : "destructive"}>
                        {data.hasDraftData ? "有" : "无"}
                      </Badge>
                    </p>
                  </div>
                </div>

                {data.source_file_name && (
                  <div>
                    <Label className="text-muted-foreground">源文件</Label>
                    <p className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {data.source_file_name}
                    </p>
                  </div>
                )}

                {data.draftDataInfo && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">草稿数据信息</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">当前步骤：</span>
                          {data.draftDataInfo.currentStep}
                        </div>
                        <div>
                          <span className="text-muted-foreground">编辑后 HTML：</span>
                          {data.draftDataInfo.editedHtmlLength.toLocaleString()} 字符
                        </div>
                        <div>
                          <span className="text-muted-foreground">原始 HTML：</span>
                          {data.draftDataInfo.originalHtmlLength.toLocaleString()} 字符
                        </div>
                        <div>
                          <span className="text-muted-foreground">标记数量：</span>
                          {data.draftDataInfo.markersCount}
                        </div>
                        <div>
                          <span className="text-muted-foreground">变量数量：</span>
                          {data.draftDataInfo.selectedVariablesCount}
                        </div>
                        <div>
                          <span className="text-muted-foreground">附件数量：</span>
                          {data.draftDataInfo.attachmentsCount}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="html">
            <Card>
              <CardHeader>
                <CardTitle>HTML 内容片段</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.htmlFragments.length === 0 ? (
                  <p className="text-muted-foreground">没有找到 HTML 内容</p>
                ) : (
                  data.htmlFragments.map((fragment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{fragment.source}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {fragment.length.toLocaleString()} 字符
                        </span>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96 whitespace-pre-wrap">
                        {fragment.preview}
                        {fragment.length > 2000 && "\n\n... (已截断)"}
                      </pre>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seal">
            <Card>
              <CardHeader>
                <CardTitle>签章区域匹配</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.sealAreaMatches.length === 0 ? (
                  <p className="text-muted-foreground">没有找到签章区域相关的匹配</p>
                ) : (
                  data.sealAreaMatches.map((match, index) => (
                    <div key={index} className="space-y-2">
                      <Badge variant="outline">{match.pattern}</Badge>
                      <div className="flex flex-wrap gap-2">
                        {match.matches.map((m, i) => (
                          <Badge key={i} variant="secondary">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {debugHtml && (
        <Card>
          <CardHeader>
            <CardTitle>导出的调试 HTML（处理后）</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96 whitespace-pre-wrap">
              {debugHtml.substring(0, 5000)}
              {debugHtml.length > 5000 && "\n\n... (已截断)"}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
