"use client";

import { useEffect } from "react";

/**
 * 全局错误处理组件
 * 用于捕获和处理开发环境中的已知无害错误
 * 
 * 主要处理：
 * 1. [object Event] - Next.js devtools 的已知问题
 * 2. AbortError - fetch 请求被取消
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // 保存原始的 console.error
    const originalConsoleError = console.error;
    
    // 过滤控制台错误输出
    console.error = (...args: unknown[]) => {
      const errorStr = args.map(arg => String(arg)).join(' ');
      // 过滤掉已知的无害错误
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
    
    // 处理未捕获的 Promise 拒绝
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
        // 完全阻止错误传播
        event.preventDefault();
        event.stopPropagation();
        if ('stopImmediatePropagation' in event) {
          (event as Event).stopImmediatePropagation();
        }
        return false;
      }
      
      // 其他错误保持原样
    };
    
    // 处理普通错误
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const errorStr = String(error);
      const errorName = error instanceof Error ? error.name : '';
      const errorMessage = error instanceof Error ? error.message : '';
      
      // 检查是否是已知的无害错误
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
    
    // 使用捕获阶段来确保我们的处理器最先执行
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}
