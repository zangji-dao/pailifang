"use client";

import { useEffect, useRef } from "react";

/**
 * 全局错误处理组件
 * 用于捕获和处理开发环境中的已知无害错误
 * 
 * 主要处理：
 * 1. [object Event] - Next.js devtools 的已知问题
 * 2. AbortError - fetch 请求被取消
 */
export function GlobalErrorHandler() {
  const installedRef = useRef(false);

  useEffect(() => {
    // 防止重复安装
    if (installedRef.current) return;
    installedRef.current = true;

    // 保存原始方法
    const originalConsoleError = console.error;
    const originalPromiseReject = Promise.reject.bind(Promise);

    // 过滤控制台错误输出
    console.error = (...args: unknown[]) => {
      const errorStr = args.map(arg => String(arg)).join(' ');
      if (
        errorStr.includes('[object Event]') ||
        errorStr.includes('AbortError') ||
        errorStr.includes('cancelled') ||
        errorStr.includes('The user aborted a request')
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // 处理未捕获的 Promise 拒绝 - 使用捕获阶段
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = String(reason);
      const reasonName = reason instanceof Error ? reason.name : '';
      const reasonMessage = reason instanceof Error ? reason.message : '';
      
      // 检查是否是已知的无害错误
      const isHarmlessError =
        reasonStr === '[object Event]' ||
        reasonStr === '[object AbortError]' ||
        reasonName === 'AbortError' ||
        reasonMessage.includes('aborted') ||
        reasonMessage.includes('cancelled') ||
        reasonMessage.includes('The user aborted a request');
      
      if (isHarmlessError) {
        event.preventDefault();
        event.stopPropagation();
        if ('stopImmediatePropagation' in event) {
          (event as Event).stopImmediatePropagation();
        }
        return false;
      }
    };
    
    // 处理普通错误
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const errorStr = String(error);
      const errorName = error instanceof Error ? error.name : '';
      const errorMessage = error instanceof Error ? error.message : '';
      
      const isHarmlessError =
        errorStr === '[object Event]' ||
        errorStr.includes('AbortError') ||
        errorName === 'AbortError' ||
        errorMessage.includes('aborted') ||
        errorMessage.includes('cancelled');
      
      if (isHarmlessError) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return false;
      }
    };

    // 处理自定义错误事件（Next.js devtools 使用的事件）
    const handleCustomError = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const errorStr = String(detail || event);
      
      if (errorStr === '[object Event]' || errorStr.includes('AbortError')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return false;
      }
    };
    
    // 注册事件监听器 - 全部使用捕获阶段
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);
    window.addEventListener('error', handleCustomError as EventListener, true);
    
    return () => {
      console.error = originalConsoleError;
      Promise.reject = originalPromiseReject;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('error', handleCustomError as EventListener, true);
    };
  }, []);

  return null;
}
