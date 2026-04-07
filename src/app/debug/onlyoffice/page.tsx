/**
 * OnlyOffice 连接测试页面
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function OnlyOfficeDebugPage() {
  const [tests, setTests] = useState<Record<string, { status: 'pending' | 'success' | 'error'; message: string }>>({});

  const runTests = async () => {
    setTests({
      env: { status: 'pending', message: '检查环境变量...' },
      api: { status: 'pending', message: '测试 API 连接...' },
      script: { status: 'pending', message: '测试脚本加载...' },
    });

    // 测试 1: 环境变量
    const onlyofficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL;
    if (onlyofficeUrl && onlyofficeUrl.startsWith('https://')) {
      setTests(prev => ({ ...prev, env: { status: 'success', message: `✓ ${onlyofficeUrl}` } }));
    } else {
      setTests(prev => ({ ...prev, env: { status: 'error', message: `✗ 未配置或不是 HTTPS: ${onlyofficeUrl || 'undefined'}` } }));
    }

    // 测试 2: API 配置接口
    try {
      const res = await fetch('/api/onlyoffice/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-debug',
          title: 'Test.docx',
          documentUrl: 'https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l',
          fileType: 'docx',
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.success && data.serverUrl?.startsWith('https://')) {
        setTests(prev => ({ ...prev, api: { status: 'success', message: `✓ ${data.serverUrl}` } }));
      } else {
        setTests(prev => ({ ...prev, api: { status: 'error', message: `✗ ${JSON.stringify(data)}` } }));
      }
    } catch (error) {
      setTests(prev => ({ ...prev, api: { status: 'error', message: `✗ ${error}` } }));
    }

    // 测试 3: 脚本加载
    try {
      const scriptUrl = `${onlyofficeUrl}/web-apps/apps/api/documents/api.js`;
      const res = await fetch(scriptUrl, { mode: 'cors' });
      
      if (res.ok) {
        const text = await res.text();
        if (text.includes('DocsAPI')) {
          setTests(prev => ({ ...prev, script: { status: 'success', message: `✓ 脚本可访问 (${text.length} bytes)` } }));
        } else {
          setTests(prev => ({ ...prev, script: { status: 'error', message: `✗ 脚本内容无效` } }));
        }
      } else {
        setTests(prev => ({ ...prev, script: { status: 'error', message: `✗ HTTP ${res.status}` } }));
      }
    } catch (error) {
      setTests(prev => ({ ...prev, script: { status: 'error', message: `✗ ${error}` } }));
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">OnlyOffice 连接测试</h1>
        <p className="text-muted-foreground">
          诊断 OnlyOffice 编辑器连接问题
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>测试结果</CardTitle>
              <Button onClick={runTests} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新测试
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 环境变量测试 */}
            <div className="flex items-start justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">环境变量</div>
                <div className="text-sm text-muted-foreground">
                  NEXT_PUBLIC_ONLYOFFICE_URL
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tests.env?.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {tests.env?.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {tests.env?.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <Badge variant={tests.env?.status === 'success' ? 'default' : tests.env?.status === 'error' ? 'destructive' : 'secondary'}>
                  {tests.env?.message || '等待...'}
                </Badge>
              </div>
            </div>

            {/* API 接口测试 */}
            <div className="flex items-start justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">API 配置接口</div>
                <div className="text-sm text-muted-foreground">
                  /api/onlyoffice/config
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tests.api?.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {tests.api?.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {tests.api?.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <Badge variant={tests.api?.status === 'success' ? 'default' : tests.api?.status === 'error' ? 'destructive' : 'secondary'}>
                  {tests.api?.message || '等待...'}
                </Badge>
              </div>
            </div>

            {/* 脚本加载测试 */}
            <div className="flex items-start justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">API 脚本</div>
                <div className="text-sm text-muted-foreground">
                  web-apps/apps/api/documents/api.js
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tests.script?.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {tests.script?.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {tests.script?.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <Badge variant={tests.script?.status === 'success' ? 'default' : tests.script?.status === 'error' ? 'destructive' : 'secondary'}>
                  {tests.script?.message || '等待...'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 页面信息 */}
        <Card>
          <CardHeader>
            <CardTitle>页面信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前 URL:</span>
                <span className="font-mono">{window.location.href}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">协议:</span>
                <span className="font-mono">{window.location.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">主机:</span>
                <span className="font-mono">{window.location.host}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 浏览器控制台提示 */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">调试提示</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-900">
            <p className="mb-2">如果测试失败，请检查浏览器控制台（F12）是否有以下错误：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>CORS 错误（跨域资源访问被阻止）</li>
              <li>Mixed Content 错误（混合内容）</li>
              <li>Net::ERR_CONNECTION_REFUSED（连接被拒绝）</li>
              <li>其他 JavaScript 错误</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
