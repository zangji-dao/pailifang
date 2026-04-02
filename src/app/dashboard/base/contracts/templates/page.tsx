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
  FileDown,
  Paperclip,
  Edit3,
  FileCheck,
  Pencil,
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
  status?: 'draft' | 'published';
  styleConfig: TemplateStyleConfig;
  clauses: TemplateClause[];
  attachments?: {
    id: string;
    name: string;
    description?: string;
    required: boolean;
    order: number;
  }[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  // 新模板格式的数据
  draft_data?: {
    editedHtml?: string;
    originalHtml?: string;
    styles?: string;
    markers?: any[];
    selectedVariables?: any[];
    attachments?: any[];
    uploadedAttachments?: any[];
  };
  source_file_url?: string;
  source_file_name?: string;
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
  
  // 导出状态
  const [exportingTemplate, setExportingTemplate] = useState<ContractTemplate | null>(null);

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
    // 所有模板（草稿和已发布）都跳转到新建页面进行编辑
    // 已发布的模板会在新建页面中加载现有数据
    if (tabs) {
      tabs.openTab({
        id: `edit-${template.id}`,
        label: `编辑: ${template.name}`,
        path: `/dashboard/base/contracts/templates/new?templateId=${template.id}`,
        icon: <Settings className="h-3.5 w-3.5" />,
      });
    } else {
      router.push(`/dashboard/base/contracts/templates/new?templateId=${template.id}`);
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

  // 导出 Word 文档
  const handleExportWord = async (template: ContractTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!template.source_file_url) {
      toast.error('该模板没有关联的源文件');
      return;
    }

    try {
      setExportingTemplate(template);
      toast.info('正在导出 Word 文档...');

      const response = await fetch('/api/contract-templates/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      // 获取文件 blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name || '合同模板'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Word 文档导出成功');

    } catch (err) {
      console.error('导出失败:', err);
      toast.error(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExportingTemplate(null);
    }
  };

  // Tab 状态
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published'>('all');
  
  // 根据Tab过滤模板
  const filteredTemplatesByTab = templates.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return t.status === 'draft';
    if (activeTab === 'published') return t.status !== 'draft';
    return true;
  });
  
  // 统计数量
  const stats = {
    all: templates.length,
    draft: templates.filter(t => t.status === 'draft').length,
    published: templates.filter(t => t.status !== 'draft').length,
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
    <div className="space-y-0">
      {/* 页面标题 */}
      <div className="py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Palette className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">合同模板</h1>
            <p className="text-sm text-muted-foreground">管理合同模板，配置样式和变量绑定</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          新建模板
        </Button>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* Tab 切换 */}
      <div className="py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all",
              activeTab === 'all'
                ? "border-amber-400 bg-amber-50 text-amber-600"
                : "border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">全部</span>
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 hover:bg-amber-100">{stats.all}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all",
              activeTab === 'draft'
                ? "border-gray-400 bg-gray-50 text-gray-600"
                : "border-slate-200 text-slate-600 hover:border-gray-200 hover:bg-gray-50/50"
            )}
          >
            <Pencil className="h-4 w-4" />
            <span className="font-medium">草稿</span>
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700 hover:bg-gray-100">{stats.draft}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all",
              activeTab === 'published'
                ? "border-green-400 bg-green-50 text-green-600"
                : "border-slate-200 text-slate-600 hover:border-green-200 hover:bg-green-50/50"
            )}
          >
            <FileCheck className="h-4 w-4" />
            <span className="font-medium">已完成</span>
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 hover:bg-green-100">{stats.published}</Badge>
          </button>
        </div>
      </div>

      {/* 模板列表 */}
      {filteredTemplatesByTab.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {activeTab === 'draft' ? '暂无草稿' : activeTab === 'published' ? '暂无已完成的模板' : '暂无合同模板'}
          </p>
          <p className="text-sm mt-1">点击上方"新建模板"创建您的第一个合同模板</p>
          <Button variant="outline" className="mt-4" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建模板
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {filteredTemplatesByTab.map((template) => {
            const typeInfo = templateTypes[template.type] || templateTypes.other;
            const isDraft = template.status === 'draft';
            
            return (
              <Card
                key={template.id}
                className={cn(
                  "group hover:shadow-lg transition-all duration-200 cursor-pointer border-2",
                  isDraft 
                    ? "border-dashed border-gray-300 bg-gray-50/50 hover:border-amber-300 hover:bg-amber-50/30"
                    : template.isDefault
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
                          {isDraft && (
                            <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-200 border-0 text-xs">
                              草稿
                            </Badge>
                          )}
                          {template.isDefault && !isDraft && (
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

                  {/* 草稿提示 */}
                  {isDraft && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>模板尚未完成，点击继续编辑</span>
                    </div>
                  )}

                  {/* 附件信息显示 */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>
                      附件: {(() => {
                        // 优先从 template.attachments 读取（上传的附件）
                        // 其次从 draft_data.uploadedAttachments 读取
                        const templateAttachments = template.attachments;
                        const uploadedAttachments = (template as any).draft_data?.uploadedAttachments;
                        
                        if (templateAttachments && templateAttachments.length > 0) {
                          return templateAttachments.length;
                        }
                        if (uploadedAttachments && uploadedAttachments.length > 0) {
                          return uploadedAttachments.length;
                        }
                        return 0;
                      })()} 个
                      {(() => {
                        // 显示附件名称
                        const templateAttachments = template.attachments;
                        const uploadedAttachments = (template as any).draft_data?.uploadedAttachments;
                        
                        let attachmentsToShow: any[] = [];
                        if (templateAttachments && templateAttachments.length > 0) {
                          attachmentsToShow = templateAttachments;
                        } else if (uploadedAttachments && uploadedAttachments.length > 0) {
                          attachmentsToShow = uploadedAttachments;
                        }
                        
                        if (attachmentsToShow.length > 0) {
                          return (
                            <span className="ml-1">
                              ({attachmentsToShow.map((a: any) => a.name || a.displayName).filter(Boolean).join(', ')})
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </span>
                  </div>

                  {/* 模板配置概览 - 仅已完成的模板显示 */}
                  {!isDraft && (
                    <>
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
                    </>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                      {template.updatedAt
                        ? `更新于 ${new Date(template.updatedAt).toLocaleDateString()}`
                        : `创建于 ${new Date(template.createdAt).toLocaleDateString()}`}
                    </div>
                    <div className="flex items-center gap-1">
                      {isDraft ? (
                        <>
                          <Button
                            size="sm"
                            className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(template);
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            继续创建
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
                        </>
                      ) : (
                        <>
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
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            onClick={(e) => handleExportWord(template, e)}
                            title="导出Word"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(template);
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            编辑
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
                        </>
                      )}
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
