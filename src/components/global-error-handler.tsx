"use client";

import { useEffect } from "react";

/**
 * 全局错误处理组件
 * 用于捕获和处理开发环境中的已知无害错误
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // 处理未捕获的 Promise 拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent | Event) => {
      // 检查是否是 PromiseRejectionEvent
      if ('reason' in event && event.reason) {
        const reasonStr = String(event.reason);
        // 忽略 [object Event] 类型的错误（Next.js devtools 的已知问题）
        // 以及 AbortError（fetch 请求被取消）
        if (
          reasonStr === "[object Event]" ||
          reasonStr === "[object AbortError]" ||
          (event.reason instanceof Error && event.reason.name === "AbortError")
        ) {
          event.preventDefault();
          event.stopPropagation();
          if ('stopImmediatePropagation' in event) {
            event.stopImmediatePropagation();
          }
          return false;
        }
      }
    };
    
    // 处理普通错误
    const handleError = (event: ErrorEvent) => {
      const errorStr = String(event.error);
      if (
        errorStr === "[object Event]" ||
        errorStr.includes("AbortError") ||
        (event.error instanceof Error && event.error.name === "AbortError")
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return false;
      }
    };
    
    // 使用捕获阶段来确保我们的处理器最先执行
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    window.addEventListener("error", handleError, true);
    
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return null;
}
