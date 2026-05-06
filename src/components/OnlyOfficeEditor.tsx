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
  events?: {
    onAppReady?: () => void;
    onDocumentReady?: () => void;
    onError?: (event: { data: { errorCode: number; errorDescription: string } }) => void;
  };
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
  /** 文档 Key 变化回调（用于强制保存等操作） */
  onDocumentKeyChange?: (key: string) => void;
  /** 插入变量函数就绪回调 */
  onInsertVariableReady?: (fn: (variable: TemplateVariable) => boolean) => void;
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
  onDocumentKeyChange,
  onInsertVariableReady,
}: OnlyOfficeEditorProps) {
  // 使用 ref 存储 onReady 回调，避免依赖变化导致重新初始化
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onDocumentKeyChangeRef = useRef(onDocumentKeyChange);
  const retryCountRef = useRef(0);
  const MAX_RETRY = 2;
  
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onDocumentKeyChangeRef.current = onDocumentKeyChange;
  }, [onReady, onError, onDocumentKeyChange]);

  // 用 ref 存储 onInsertVariableReady，避免循环依赖
  const onInsertVariableReadyRef = useRef(onInsertVariableReady);
  useEffect(() => {
    onInsertVariableReadyRef.current = onInsertVariableReady;
  }, [onInsertVariableReady]);
  
  // 使用 ref 存储非身份相关的配置项，避免变化时重建编辑器
  const titleRef = useRef(title);
  const fileTypeRef = useRef(fileType);
  const tokenRef = useRef(token);
  const heightRef = useRef(height);
  const serverUrlRef = useRef(serverUrl);
  const zoomLevelRef = useRef(zoomLevel);

  useEffect(() => {
    titleRef.current = title;
    fileTypeRef.current = fileType;
    tokenRef.current = token;
    heightRef.current = height;
    serverUrlRef.current = serverUrl;
    zoomLevelRef.current = zoomLevel;
  }, [title, fileType, token, height, serverUrl, zoomLevel]);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DocEditor | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
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
  }, []);

  // 获取 OnlyOffice iframe 引用
  const getIframe = useCallback(() => {
    if (iframeRef.current) {
      return iframeRef.current;
    }
    // OnlyOffice iframe 通常在容器内
    const container = containerRef.current;
    if (container) {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        iframeRef.current = iframe;
        return iframe;
      }
    }
    return null;
  }, []);

  // 插入变量（内容控件）- 通过 postMessage 与 OnlyOffice 通信
  const insertVariable = useCallback((variable: TemplateVariable) => {
    console.log("[OnlyOffice] 尝试插入变量:", variable);
    
    const iframe = getIframe();
    if (!iframe || !iframe.contentWindow) {
      console.warn("[OnlyOffice] 找不到 iframe，无法插入变量");
      return false;
    }

    // 构建内容控件数据
    const contentControlData = {
      type: "onExternalPluginMessage",
      data: {
        type: "insertVariable",
        data: {
          key: variable.key,
          name: variable.name,
          type: variable.type || 'text',
          category: variable.category,
        }
      }
    };

    // 发送消息到 OnlyOffice iframe
    iframe.contentWindow.postMessage(contentControlData, "*");
    console.log("[OnlyOffice] 已发送插入变量消息:", contentControlData);
    
    return true;
  }, [getIframe]);

  // 监听激活的变量变化
  useEffect(() => {
    if (activeVariable && !isLoading) {
      insertVariable(activeVariable);
    }
  }, [activeVariable, isLoading, insertVariable]);

  // 监听来自 OnlyOffice 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 只处理来自 OnlyOffice 的消息
      if (event.data && event.data.type) {
        console.log("[OnlyOffice] 收到消息:", event.data);
        
        // 处理变量插入回调
        if (event.data.type === "onExternalPluginMessageCallback") {
          console.log("[OnlyOffice] 插件回调:", event.data);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 初始化编辑器
  // 只在文档身份变化时重建：documentId、documentUrl、callbackUrl
  // 其他配置项（title, zoomLevel, height 等）通过 ref 读取，不会触发重建
  const initEditor = useCallback(async () => {
    console.log("[OnlyOffice] initEditor 被调用");
    console.log("[OnlyOffice] 参数:", { documentId, documentUrl, callbackUrl });

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

    // 销毁旧的编辑器实例
    if (editorRef.current) {
      console.log("[OnlyOffice] 销毁旧的编辑器实例");
      try {
        editorRef.current.destroyEditor();
      } catch (e) {
        console.warn("[OnlyOffice] 销毁编辑器时出错:", e);
      }
      editorRef.current = null;
      iframeRef.current = null;
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
      
      // 通知父组件当前文档 key（用于强制保存等操作）
      onDocumentKeyChangeRef.current?.(documentKey);

      // 从 ref 读取配置项，避免因为配置变化重建编辑器
      const currentTitle = titleRef.current;
      const currentFileType = fileTypeRef.current;
      const currentToken = tokenRef.current;
      const currentHeight = heightRef.current;
      const currentServerUrl = serverUrlRef.current;
      const currentZoomLevel = zoomLevelRef.current;

      const config: EditorConfig = {
        document: {
          fileType: currentFileType,
          key: documentKey,
          title: currentTitle,
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
          documentServerUrl: currentServerUrl,
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
            spellcheck: false,
            toolbarNoTabs: false,
            unit: "cm",
            zoom: currentZoomLevel,
            uiTheme: "theme-light",
          },
          // 启用变量绑定插件（如果服务器上已部署）
          plugins: {
            autostart: ["asc.{8D6E3F7A-1B2C-4D5E-8F9A-0B1C2D3E4F5A}"],
          },
        },
        type: "desktop",
        width: "100%",
        height: currentHeight,
        events: {
          onAppReady: () => {
            console.log("[OnlyOffice] onAppReady 触发");
            setIsLoading(false);
            retryCountRef.current = 0; // 重置重试计数
            onReadyRef.current?.();
          },
          onError: (event) => {
            console.error("[OnlyOffice] onError 触发:", event);
            // OnlyOffice 错误格式可能不同，做防御性处理
            const rawData = event?.data || event;
            const errorData = rawData as Record<string, unknown>;
            const errorCode = (errorData?.errorCode as number) ?? (errorData?.error as number) ?? -1;
            const errorDescription = (errorData?.errorDescription as string) ?? (errorData?.message as string) ?? JSON.stringify(errorData);
            console.error("[OnlyOffice] 错误详情 - code:", errorCode, "desc:", errorDescription);

            // -4: 下载失败（临时性错误），自动重试
            if (errorCode === -4 && retryCountRef.current < MAX_RETRY) {
              retryCountRef.current += 1;
              console.log(`[OnlyOffice] 下载失败，3秒后自动重试 (${retryCountRef.current}/${MAX_RETRY})...`);
              setTimeout(() => {
                if (editorRef.current) {
                  try {
                    editorRef.current.destroyEditor();
                    editorRef.current = null;
                  } catch {
                    // ignore
                  }
                }
                initEditor();
              }, 3000);
              return;
            }

            const errorMsg = `编辑器错误 (${errorCode}): ${errorDescription}`;
            setLoadError(errorMsg);
            setIsLoading(false);
            onErrorRef.current?.(new Error(errorMsg));
          },
        },
      };

      // 如果提供了 JWT token
      if (currentToken) {
        config.token = currentToken;
      }

      // 创建新编辑器
      console.log("[OnlyOffice] 创建 DocEditor，containerId:", containerId);
      const editorInstance = new window.DocsAPI.DocEditor(containerId, config);
      editorRef.current = editorInstance;
      console.log("[OnlyOffice] DocEditor 创建完成");

      // 延迟查找 iframe（等待 OnlyOffice 创建）
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          iframeRef.current = iframe;
          console.log("[OnlyOffice] 找到 iframe:", iframe.src);
        }
      }, 2000);

    } catch (error) {
      console.error("[OnlyOffice] 初始化失败:", error);
      const err = error instanceof Error ? error : new Error(String(error));
      setLoadError(err.message);
      setIsLoading(false);
      onErrorRef.current?.(err);
    }
  }, [
    documentId,
    documentUrl,
    callbackUrl,
    loadOnlyOfficeScript,
    // 其他配置项通过 ref 读取，不触发重建
  ]);

  // 初始化
  useEffect(() => {
    initEditor();

    return () => {
      if (editorRef.current) {
        // 清理 iframe 焦点监听
        const iframe = iframeRef.current;
        if (iframe && (iframe as HTMLIFrameElement & { _cleanupFocusListener?: () => void })._cleanupFocusListener) {
          (iframe as HTMLIFrameElement & { _cleanupFocusListener?: () => void })._cleanupFocusListener?.();
        }
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }
    };
  }, [initEditor]);

  // 通知父组件 insertVariable 方法已就绪
  useEffect(() => {
    onInsertVariableReadyRef.current?.(insertVariable);
  }, [insertVariable]);

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
