/**
 * 全局提示工具
 * 
 * 使用方式：
 * - toast.success("操作成功")
 * - toast.error("操作失败")
 * - toast.warning("警告信息")
 * - toast.info("提示信息")
 * - toast.loading("加载中...")
 * 
 * 注意：confirm 函数需要在 React 组件中使用 useConfirm Hook
 */

import { toast as sonnerToast } from "sonner";

/**
 * Toast 提示工具
 */
export const toast = {
  /**
   * 成功提示
   */
  success: (message: string) => {
    sonnerToast.success(message);
  },

  /**
   * 错误提示
   */
  error: (message: string) => {
    sonnerToast.error(message);
  },

  /**
   * 警告提示
   */
  warning: (message: string) => {
    sonnerToast.warning(message);
  },

  /**
   * 信息提示
   */
  info: (message: string) => {
    sonnerToast.info(message);
  },

  /**
   * 加载提示
   * @returns 可以调用 dismiss 关闭
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * 关闭指定 toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Promise 提示
   * 自动根据 Promise 状态显示成功/失败
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, { loading, success, error });
  },
};

/**
 * Toast 类型
 */
export type Toast = typeof toast;
