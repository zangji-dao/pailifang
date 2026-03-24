"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, GripVertical, FileText, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContractType {
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

// 可排序的合同类型项组件
function SortableContractTypeItem({
  contractType,
  onEdit,
  onDelete,
}: {
  contractType: ContractType;
  onEdit: (contractType: ContractType) => void;
  onDelete: (contractType: ContractType) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contractType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card border rounded-lg transition-colors",
        "hover:border-amber-300 hover:bg-amber-50/30"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{contractType.name}</div>
        {contractType.description && (
          <div className="text-sm text-muted-foreground truncate">
            {contractType.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(contractType)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(contractType)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ContractTypesPage() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingContractType, setEditingContractType] = useState<ContractType | null>(null);
  const [deletingContractType, setDeletingContractType] = useState<ContractType | null>(null);
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

  // 获取合同类型列表
  const fetchContractTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/contract-types");
      const data = await response.json();
      if (data.success) {
        setContractTypes(data.data);
      }
    } catch (error) {
      console.error("获取合同类型列表失败:", error);
      toast.error("无法获取合同类型列表");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractTypes();
  }, [fetchContractTypes]);

  // 拖拽排序结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = contractTypes.findIndex((item) => item.id === active.id);
      const newIndex = contractTypes.findIndex((item) => item.id === over.id);

      const newContractTypes = arrayMove(contractTypes, oldIndex, newIndex);
      setContractTypes(newContractTypes);

      // 更新后端排序
      try {
        const response = await fetch("/api/contract-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reorder",
            items: newContractTypes.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
          }),
        });

        if (!response.ok) {
          // 回滚
          setContractTypes(contractTypes);
        }
      } catch (error) {
        console.error("更新排序失败:", error);
        // 回滚
        setContractTypes(contractTypes);
      }
    }
  };

  // 打开新增对话框
  const handleAdd = () => {
    setEditingContractType(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (contractType: ContractType) => {
    setEditingContractType(contractType);
    setFormData({
      name: contractType.name,
      description: contractType.description || "",
    });
    setDialogOpen(true);
  };

  // 打开删除确认对话框
  const handleDelete = (contractType: ContractType) => {
    setDeletingContractType(contractType);
    setDeleteDialogOpen(true);
  };

  // 保存合同类型
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入合同类型名称");
      return;
    }

    setSaving(true);
    try {
      const url = editingContractType
        ? `/api/contract-types/${editingContractType.id}`
        : "/api/contract-types";
      const method = editingContractType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingContractType ? "更新成功" : "创建成功");
        setDialogOpen(false);
        fetchContractTypes();
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存合同类型失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deletingContractType) return;

    try {
      const response = await fetch(`/api/contract-types/${deletingContractType.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("删除成功");
        setDeleteDialogOpen(false);
        fetchContractTypes();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除合同类型失败:", error);
      toast.error("删除失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">合同类型管理</h1>
            <p className="text-sm text-muted-foreground">管理合同类型，用于合同创建时选择</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          新增类型
        </Button>
      </div>

      {/* 说明 */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        管理合同类型分类。拖拽可调整显示顺序。当前类型用于新建合同时选择。
      </div>

      {/* 合同类型列表 */}
      {contractTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p>暂无合同类型</p>
          <p className="text-sm mt-1">点击上方"新增类型"添加</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={contractTypes.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {contractTypes.map((contractType) => (
                <SortableContractTypeItem
                  key={contractType.id}
                  contractType={contractType}
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
              {editingContractType ? "编辑合同类型" : "新增合同类型"}
            </DialogTitle>
            <DialogDescription>
              {editingContractType
                ? "修改合同类型信息"
                : "添加一个新的合同类型"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">类型名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="如：园区入驻服务合同"
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
                placeholder="可选，输入类型描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
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
              确定要删除合同类型「{deletingContractType?.name}」吗？此操作不可恢复。
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
