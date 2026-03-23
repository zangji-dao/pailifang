"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, GripVertical, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";

interface Industry {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface FormData {
  name: string;
  description: string;
}

// 可排序的行业项组件
function SortableIndustryItem({
  industry,
  onEdit,
  onDelete,
}: {
  industry: Industry;
  onEdit: (industry: Industry) => void;
  onDelete: (industry: Industry) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: industry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{industry.name}</div>
        {industry.description && (
          <div className="text-sm text-muted-foreground truncate">
            {industry.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(industry)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(industry)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function IndustriesPage() {
  const { toast } = useToast();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [deletingIndustry, setDeletingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 获取行业列表
  const fetchIndustries = useCallback(async () => {
    try {
      const response = await fetch("/api/industries");
      const data = await response.json();
      if (data.success) {
        setIndustries(data.data);
      }
    } catch (error) {
      console.error("获取行业列表失败:", error);
      toast({
        title: "获取失败",
        description: "无法获取行业列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  // 拖拽排序结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = industries.findIndex((item) => item.id === active.id);
      const newIndex = industries.findIndex((item) => item.id === over.id);

      const newIndustries = arrayMove(industries, oldIndex, newIndex);
      setIndustries(newIndustries);

      // 更新后端排序
      try {
        const response = await fetch("/api/industries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reorder",
            items: newIndustries.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
          }),
        });

        // 如果后端不支持 reorder action，则逐个更新
        if (!response.ok) {
          // 回滚
          setIndustries(industries);
        }
      } catch (error) {
        console.error("更新排序失败:", error);
        // 回滚
        setIndustries(industries);
      }
    }
  };

  // 打开新增对话框
  const handleAdd = () => {
    setEditingIndustry(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description || "",
    });
    setDialogOpen(true);
  };

  // 打开删除确认对话框
  const handleDelete = (industry: Industry) => {
    setDeletingIndustry(industry);
    setDeleteDialogOpen(true);
  };

  // 保存行业
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "请输入行业名称",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingIndustry
        ? `/api/industries/${editingIndustry.id}`
        : "/api/industries";
      const method = editingIndustry ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: editingIndustry ? "更新成功" : "创建成功",
        });
        setDialogOpen(false);
        fetchIndustries();
      } else {
        toast({
          title: "保存失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("保存行业失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deletingIndustry) return;

    try {
      const response = await fetch(`/api/industries/${deletingIndustry.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "删除成功",
        });
        setDeleteDialogOpen(false);
        fetchIndustries();
      } else {
        toast({
          title: "删除失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("删除行业失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-6 w-6 text-violet-500" />
          <h1 className="text-2xl font-semibold text-foreground">行业管理</h1>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          新增行业
        </Button>
      </div>

      {/* 说明 */}
      <div className="text-sm text-muted-foreground">
        管理企业入驻时可选的行业分类。拖拽可调整显示顺序。
      </div>

      {/* 行业列表 */}
      {industries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Tags className="h-12 w-12 mb-4 opacity-50" />
          <p>暂无行业数据</p>
          <p className="text-sm mt-1">点击上方"新增行业"添加</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={industries.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {industries.map((industry) => (
                <SortableIndustryItem
                  key={industry.id}
                  industry={industry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndustry ? "编辑行业" : "新增行业"}
            </DialogTitle>
            <DialogDescription>
              {editingIndustry
                ? "修改行业信息"
                : "添加一个新的行业分类"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">行业名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入行业名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="可选，输入行业描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除行业"{deletingIndustry?.name}"吗？此操作不可恢复。
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
