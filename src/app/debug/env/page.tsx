/**
 * 环境变量调试页面
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnvDebugPage() {
  const [env, setEnv] = useState<Record<string, string>>({});

  useEffect(() => {
    setEnv({
      "NEXT_PUBLIC_ONLYOFFICE_URL": process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "undefined",
      "window.location.href": window.location.href,
      "window.location.protocol": window.location.protocol,
    });
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">环境变量调试</h1>

      <Card>
        <CardHeader>
          <CardTitle>客户端环境变量</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg overflow-auto">
            {JSON.stringify(env, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>测试 OnlyOffice API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>OnlyOffice URL:</strong>{" "}
              {env["NEXT_PUBLIC_ONLYOFFICE_URL"]}
            </p>
            <p>
              <strong>API 脚本:</strong>{" "}
              {env["NEXT_PUBLIC_ONLYOFFICE_URL"]
                ? `${env["NEXT_PUBLIC_ONLYOFFICE_URL"]}/web-apps/apps/api/documents/api.js`
                : "未配置"}
            </p>
            <p>
              <strong>协议:</strong> {env["window.location.protocol"]}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
