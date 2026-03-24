"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "enterprise_create_form_draft";

/**
 * 表单状态持久化 hook
 * 使用 sessionStorage 保存表单状态，关闭浏览器标签页后自动清除
 * 
 * 功能：
 * - 自动保存表单状态到 sessionStorage
 * - 刷新页面时自动恢复数据
 * - clearCache 可重置到初始状态
 */
export function useFormPersistence<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  // 保存初始状态的引用
  const initialStateRef = useRef(initialState);

  // 初始化状态：刷新页面时从 sessionStorage 恢复
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialState;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 检查是否有保存的数据
        if (parsed && Object.keys(parsed).length > 0) {
          return { ...initialState, ...parsed } as T;
        }
      }
    } catch (e) {
      console.error("恢复表单状态失败:", e);
    }
    return initialState;
  });

  // 更新状态并保存
  const updateState = useCallback((updates: Partial<T>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates } as T;
      // 异步保存，避免阻塞渲染
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (e) {
          console.error("保存表单状态失败:", e);
        }
      });
      return newState;
    });
  }, []);

  // 清除缓存并重置到初始状态
  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      // 重置状态到初始值
      setState(initialStateRef.current);
    } catch (e) {
      console.error("清除缓存失败:", e);
    }
  }, []);

  // 页面卸载时保存（可选，作为额外保障）
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state]);

  return [state, updateState, clearCache];
}
