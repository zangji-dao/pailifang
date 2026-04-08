/**
 * OnlyOffice 文档编辑器组件
 * 用于合同模板编辑，支持变量绑定（内容控件）
 */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { TemplateVariable } from "@/types/template-variable";

// OnlyOffice 类型定义
interface DocEditor {
  destroyEditor: () => void;
}

interface EditorConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions?: {
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
    documentServerUrl?: string;  // 文档服务器地址
    lang: string;
    user?: {
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
      uiTheme?: "theme-light" | "theme-dark" | "theme-contrast-dark";
      [key: string]: unknown;
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

interface OnlyOfficeEditorProps {
  /** 文档 ID（用于唯一标识文档） */
  documentId: string;
  /** 文档标题 */
  title: string;
  /** 文档 URL（OnlyOffice 服务可访问的地址） */
  documentUrl: string;
  /** 文件类型 */
  fileType?: string;
  /** 回调 URL（用于保存文档） */
  callbackUrl: string;
  /** JWT Token（如果启用了 JWT） */
  token?: string;
  /** 编辑器高度 */
  height?: string;
  /** OnlyOffice 服务地址 */
  serverUrl?: string;
  /** 编辑器准备就绪回调 */
  onReady?: () => void;
  /** 文档保存回调 */
  onSave?: (url: string) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 变量列表（用于变量绑定） */
  variables?: TemplateVariable[];
  /** 当前激活的变量（用于插入） */
  activeVariable?: TemplateVariable | null;
  /** 插入变量回调 */
  onInsertVariable?: (variable: TemplateVariable) => void;
  /** 缩放级别（百分比） */
  zoomLevel?: number;
}

// 声明全局 DocsAPI
declare global {
  interface Window {
    DocsAPI: {
      ready: boolean;
      DocEditor: new (containerId: string, config: EditorConfig) => DocEditor;
    };
  }
}

export function OnlyOfficeEditor({
  documentId,
  title,
  documentUrl,
  fileType = "docx",
  callbackUrl,
  token,
  height = "100%",
  serverUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "http://localhost:8080",
  onReady,
  onError,
  variables = [],
  activeVariable,
  zoomLevel = 100,
}: OnlyOfficeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DocEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // 加载 OnlyOffice JS API (使用本地 SDK，兼容 9.x)
  const loadOnlyOfficeScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 使用本地 SDK（已修改为指向云服务器）
      const localSdkUrl = '/onlyoffice-sdk/9.3.1-d4a23844f4ad8b02d407339fff4a8e3c/web-apps/apps/api/documents/api.js';
      console.log("[OnlyOffice] 尝试从本地加载 SDK:", localSdkUrl);
      
      // 如果 DocsAPI 已存在，直接返回（9.x 不需要 ready 检查）
      if (window.DocsAPI) {
        console.log("[OnlyOffice] DocsAPI 已存在");
        scriptLoadedRef.current = true;
        resolve();
        return;
      }

      // 先移除任何已存在的脚本标签和 DocsAPI
      const existingScript = document.getElementById("onlyoffice-api-script");
      if (existingScript) {
        console.log("[OnlyOffice] 移除旧的脚本标签");
        existingScript.remove();
      }
      
      // 清理旧的 DocsAPI
      if ((window as unknown as Record<string, unknown>).DocsAPI) {
        delete (window as unknown as Record<string, unknown>).DocsAPI;
      }
      scriptLoadedRef.current = false;

      // 创建新的脚本标签（从本地加载）
      const script = document.createElement("script");
      script.id = "onlyoffice-api-script";
      script.src = localSdkUrl;
      script.async = true;
      
      console.log("[OnlyOffice] 创建脚本标签:", script.src);

      script.onload = () => {
        console.log("[OnlyOffice] 脚本 onload 触发");
        console.log("[OnlyOffice] window.DocsAPI:", window.DocsAPI);
        console.log("[OnlyOffice] window.DocsAPI 完整对象:", JSON.stringify(Object.keys(window.DocsAPI || {})));
        
        // OnlyOffice 9.x: api.js 加载完成即可使用，不需要 ready 检查
        if (window.DocsAPI && window.DocsAPI.DocEditor) {
          scriptLoadedRef.current = true;
          console.log("[OnlyOffice] DocsAPI 加载完成");
          resolve();
        } else {
          console.error("[OnlyOffice] DocsAPI.DocEditor 不存在");
          reject(new Error("OnlyOffice API 加载失败"));
        }
      };

      script.onerror = (e) => {
        console.error("[OnlyOffice] 脚本加载失败:", e);
        reject(new Error("OnlyOffice API 脚本加载失败"));
      };

      document.head.appendChild(script);
      console.log("[OnlyOffice] 脚本标签已添加到 head");
    });
  }, [serverUrl]);

  // 初始化编辑器
  const initEditor = useCallback(async () => {
    console.log("[OnlyOffice] initEditor 被调用");
    console.log("[OnlyOffice] 参数:", { documentId, title, documentUrl, callbackUrl, serverUrl });

    // 检查容器是否存在
    if (!containerRef.current) {
      console.log("[OnlyOffice] containerRef.current 为空，等待挂载...");
      // 延迟等待容器挂载
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!containerRef.current) {
        console.error("[OnlyOffice] 容器仍未挂载");
        return;
      }
    }

    // 清空容器，确保 OnlyOffice 可以正确插入 iframe
    const containerId = `onlyoffice-editor-${documentId}`;
    containerRef.current.innerHTML = '';
    
    // 验证容器 ID
    if (containerRef.current.id !== containerId) {
      containerRef.current.id = containerId;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      console.log("[OnlyOffice] 开始加载脚本...");
      await loadOnlyOfficeScript();
      console.log("[OnlyOffice] 脚本加载完成，准备创建编辑器...");

      // 生成唯一的文档 key（用于区分不同版本的文档）
      const documentKey = `${documentId}-${Date.now()}`;
      console.log("[OnlyOffice] documentKey:", documentKey);

      const config: EditorConfig = {
        document: {
          fileType,
          key: documentKey,
          title: title,
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
          documentServerUrl: serverUrl,  // 文档服务器地址
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
            zoom: zoomLevel,
            // 主题设置：theme-light（浅色，默认橙色）或 theme-dark（深色）
            // 注意：OnlyOffice 默认的橙色是品牌色，要完全改变需要服务器端配置
            uiTheme: "theme-light",
          },
          // 插件配置 - 暂时禁用，待插件部署后再启用
          // plugins: {
          //   autostart: ["asc.{8D6E3F7A-1B2C-4D5E-8F9A-0B1C2D3E4F5A}"],
          //   pluginsData: [
          //     `${serverUrl}/plugins/variable-binding/manifest.json`,
          //   ],
          // },
        },
        type: "desktop",
        width: "100%",
        height: height,
      };

      // 如果提供了 JWT token
      if (token) {
        config.token = token;
      }

      // 销毁旧编辑器
      if (editorRef.current) {
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }

      // 创建新编辑器
      console.log("[OnlyOffice] 创建 DocEditor，containerId:", containerId);
      const editorInstance = new window.DocsAPI.DocEditor(containerId, config);
      editorRef.current = editorInstance;
      console.log("[OnlyOffice] DocEditor 创建完成");

      setIsLoading(false);
      onReady?.();
    } catch (error) {
      console.error("[OnlyOffice] 初始化失败:", error);
      const err = error instanceof Error ? error : new Error(String(error));
      setLoadError(err.message);
      setIsLoading(false);
      onError?.(err);
    }
  }, [
    documentId,
    title,
    documentUrl,
    fileType,
    callbackUrl,
    token,
    height,
    loadOnlyOfficeScript,
    onReady,
    onError,
  ]);

  // 插入变量（内容控件）
  const insertVariable = useCallback((variable: TemplateVariable) => {
    // OnlyOffice 通过插件实现内容控件
    // 这里需要调用 OnlyOffice 的插件 API
    console.log("插入变量:", variable);
    // TODO: 实现 OnlyOffice 插件调用
  }, []);

  // 监听激活的变量变化
  useEffect(() => {
    if (activeVariable && !isLoading) {
      insertVariable(activeVariable);
    }
  }, [activeVariable, isLoading, insertVariable]);

  // 初始化
  useEffect(() => {
    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }
    };
  }, [initEditor]);

  return (
    <div className="relative w-full h-full">
      {/* OnlyOffice 容器 - 必须是干净的容器 */}
      <div
        ref={containerRef}
        id={`onlyoffice-editor-${documentId}`}
        className="w-full h-full"
      />
      
      {/* 加载状态 overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">正在加载编辑器...</p>
          </div>
        </div>
      )}

      {/* 错误状态 overlay */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">编辑器加载失败</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={initEditor} className="w-full">
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default OnlyOfficeEditor;
