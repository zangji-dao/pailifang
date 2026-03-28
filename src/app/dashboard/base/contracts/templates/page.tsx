"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Eye,
  Copy,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  Palette,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTabs } from "@/app/dashboard/tabs-context";

// 类型定义
interface TemplateStyleConfig {
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  font: { family: string; size: number; lineHeight: number };
  titleFont: { family: string; size: number; weight: string };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
    headerBg: string;
  };
  layout: {
    showLogo: boolean;
    logoPosition: string;
    showPageNumber: boolean;
    pageNumberPosition: string;
    headerHeight: number;
    footerHeight: number;
  };
  clauseStyle: {
    numberingStyle: string;
    indent: number;
    spacing: number;
  };
}

interface TemplateClause {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  editable: boolean;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  styleConfig: TemplateStyleConfig;
  clauses: TemplateClause[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// 模板类型配置
const templateTypes: Record<string, { label: string; color: string; bgColor: string }> = {
  tenant: { label: "入驻合同", color: "text-blue-600", bgColor: "bg-blue-50" },
  service: { label: "服务合同", color: "text-green-600", bgColor: "bg-green-50" },
  lease: { label: "租赁合同", color: "text-purple-600", bgColor: "bg-purple-50" },
  other: { label: "其他合同", color: "text-gray-600", bgColor: "bg-gray-50" },
};

export default function ContractTemplatesPage() {
  const router = useRouter();
  const tabs = useTabs();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<ContractTemplate | null>(null);

  // 获取模板列表
  const fetchTemplates = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch("/api/contract-templates", { signal });
      if (!response.ok) throw new Error("获取模板列表失败");
      const result = await response.json();
      setTemplates(result.data || []);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("获取模板列表失败:", err);
      setError(err instanceof Error ? err.message : "获取模板列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTemplates(controller.signal);
    return () => controller.abort();
  }, [fetchTemplates]);

  // 打开模板编辑页面
  const handleEdit = (template: ContractTemplate) => {
    if (tabs) {
      tabs.openTab({
        id: `template-${template.id}`,
        label: template.name,
        path: `/dashboard/base/contracts/templates/${template.id}`,
        icon: <Settings className="h-3.5 w-3.5" />,
      });
    } else {
      router.push(`/dashboard/base/contracts/templates/${template.id}`);
    }
  };

  // 创建新模板
  const handleCreate = () => {
    if (tabs) {
      tabs.openTab({
        id: "new-template",
        label: "新建模板",
        path: "/dashboard/base/contracts/templates/new",
        icon: <Plus className="h-3.5 w-3.5" />,
      });
    } else {
      router.push("/dashboard/base/contracts/templates/new");
    }
  };

  // 复制模板
  const handleCopy = async (template: ContractTemplate) => {
    try {
      const response = await fetch("/api/contract-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (副本)`,
          description: template.description,
          type: template.type,
          style_config: template.styleConfig,
          clauses: template.clauses,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("模板复制成功");
        fetchTemplates();
      } else {
        toast.error(result.error || "复制失败");
      }
    } catch (err) {
      console.error("复制模板失败:", err);
      toast.error("复制失败");
    }
  };

  // 删除模板
  const handleDelete = (template: ContractTemplate) => {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const response = await fetch(`/api/contract-templates?id=${deletingTemplate.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("删除成功");
        setDeleteDialogOpen(false);
        fetchTemplates();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除模板失败:", err);
      toast.error("删除失败");
    }
  };

  // 设为默认模板
  const handleSetDefault = async (template: ContractTemplate) => {
    try {
      const response = await fetch("/api/contract-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          is_default: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("已设为默认模板");
        fetchTemplates();
      } else {
        toast.error(result.error || "设置失败");
      }
    } catch (err) {
      console.error("设置默认模板失败:", err);
      toast.error("设置失败");
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => fetchTemplates()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Palette className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">合同模板配置</h1>
            <p className="text-sm text-muted-foreground">自定义合同模板的样式和条款内容</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          新建模板
        </Button>
      </div>

      {/* 功能说明 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">模板配置功能</p>
            <p className="text-amber-700 mt-1">
              配置合同模板的页面布局、字体样式、颜色方案等视觉元素，以及合同的条款内容。
              设为默认的模板将在创建合同时优先使用。
            </p>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">暂无合同模板</p>
          <p className="text-sm mt-1">点击上方"新建模板"创建您的第一个合同模板</p>
          <Button variant="outline" className="mt-4" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建模板
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const typeInfo = templateTypes[template.type] || templateTypes.other;
            return (
              <Card
                key={template.id}
                className={cn(
                  "group hover:shadow-lg transition-all duration-200 cursor-pointer border-2",
                  template.isDefault
                    ? "border-amber-400 bg-gradient-to-br from-amber-50/50 to-orange-50/50"
                    : "border-transparent hover:border-amber-200"
                )}
                onClick={() => handleEdit(template)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeInfo.bgColor)}>
                        <FileText className={cn("h-5 w-5", typeInfo.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          {template.isDefault && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              默认
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-xs mt-1", typeInfo.color, typeInfo.bgColor)}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* 模板配置概览 */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>纸张: {template.styleConfig?.pageSize || 'A4'}</span>
                    <span>字体: {template.styleConfig?.font?.family || 'SimSun'}</span>
                    <span>条款: {template.clauses?.length || 0}条</span>
                  </div>

                  {/* 颜色预览 */}
                  {template.styleConfig?.colors && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted-foreground">配色:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: template.styleConfig.colors.primary }}
                          title="主色"
                        />
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: template.styleConfig.colors.secondary }}
                          title="辅助色"
                        />
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: template.styleConfig.colors.headerBg }}
                          title="背景色"
                        />
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                      {template.updatedAt
                        ? `更新于 ${new Date(template.updatedAt).toLocaleDateString()}`
                        : `创建于 ${new Date(template.createdAt).toLocaleDateString()}`}
                    </div>
                    <div className="flex items-center gap-1">
                      {!template.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(template);
                          }}
                          title="设为默认"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template);
                        }}
                        title="复制"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                        title="编辑"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template);
                        }}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除合同模板「{deletingTemplate?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
