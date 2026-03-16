"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react"

type ConfirmType = "warning" | "danger" | "info" | "success"

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  type?: ConfirmType
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmBg: "bg-amber-500 hover:bg-amber-600",
  },
  danger: {
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmBg: "bg-red-500 hover:bg-red-600",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmBg: "bg-blue-500 hover:bg-blue-600",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    confirmBg: "bg-green-500 hover:bg-green-600",
  },
}

/**
 * 自定义确认弹窗
 * - 替代原生 confirm/alert
 * - 支持多种类型：warning/danger/info/success
 * - 毛玻璃背景
 * - 优雅动画
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  type = "warning",
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  // ESC 键关闭
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
        onCancel?.()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, onCancel])

  // 锁定滚动
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 毛玻璃遮罩 */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleCancel}
      />

      {/* 弹窗主体 */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
          {/* 内容区 */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* 图标 */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                config.iconBg
              )}>
                <Icon className={cn("w-6 h-6", config.iconColor)} />
              </div>

              {/* 文字 */}
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                {description && (
                  <p className="text-sm text-slate-500 mt-1.5">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* 按钮区 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                config.confirmBg
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 轻量提示弹窗（只有确认按钮）
 */
interface AlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  type?: "info" | "success" | "warning" | "error"
  buttonText?: string
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  buttonText = "我知道了",
}: AlertModalProps) {
  const config = typeConfig[type === "error" ? "danger" : type]
  const Icon = config.icon

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                config.iconBg
              )}>
                <Icon className={cn("w-6 h-6", config.iconColor)} />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                {description && (
                  <p className="text-sm text-slate-500 mt-1.5">{description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                config.confirmBg
              )}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
