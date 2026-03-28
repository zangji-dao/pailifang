"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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

// 类型定义
interface TemplateStyleConfig {
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  font: { family: string; size: number; lineHeight: number };
  titleFont: { family: string; size: number; weight: 'normal' | 'bold' };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
    headerBg: string;
  };
  layout: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    showPageNumber: boolean;
    pageNumberPosition: 'left' | 'center' | 'right';
    headerHeight: number;
    footerHeight: number;
  };
  clauseStyle: {
    numberingStyle: 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
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

// 默认样式配置
const defaultStyleConfig: TemplateStyleConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 25, right: 20, bottom: 25, left: 20 },
  font: { family: 'SimSun', size: 12, lineHeight: 1.8 },
  titleFont: { family: 'SimHei', size: 18, weight: 'bold' },
  colors: {
    primary: '#1a1a1a',
    secondary: '#666666',
    text: '#333333',
    border: '#e5e5e5',
    headerBg: '#f5f5f5',
  },
  layout: {
    showLogo: true,
    logoPosition: 'center',
    showPageNumber: true,
    pageNumberPosition: 'center',
    headerHeight: 60,
    footerHeight: 40,
  },
  clauseStyle: {
    numberingStyle: 'decimal',
    indent: 24,
    spacing: 12,
  },
};

// 字体选项
const fontOptions = [
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];

// 可排序的条款项组件
function SortableClauseItem({
  clause,
  onEdit,
  onDelete,
}: {
  clause: TemplateClause;
  onEdit: (clause: TemplateClause) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clause.id });

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
        "flex items-start gap-3 p-4 bg-card border rounded-lg transition-colors",
        "hover:border-amber-300 hover:bg-amber-50/30"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{clause.title}</span>
          {clause.required && (
            <Badge variant="outline" className="text-xs">必填</Badge>
          )}
          {clause.editable && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">可编辑</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">
          {clause.content}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(clause)}
          className="h-8 w-8 p-0"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(clause.id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 条款编辑对话框
function ClauseEditDialog({
  clause,
  open,
  onOpenChange,
  onSave,
}: {
  clause: TemplateClause | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (clause: TemplateClause) => void;
}) {
  const [formData, setFormData] = useState<TemplateClause>({
    id: '',
    title: '',
    content: '',
    order: 0,
    required: false,
    editable: true,
  });

  useEffect(() => {
    if (clause) {
      setFormData(clause);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        title: '',
        content: '',
        order: 0,
        required: false,
        editable: true,
      });
    }
  }, [clause, open]);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity",
      open ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle>{clause ? '编辑条款' : '新增条款'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            <Label>条款标题</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="如：服务内容"
            />
          </div>
          <div className="space-y-2">
            <Label>条款内容</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="输入条款内容，使用换行分隔段落"
              rows={8}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
              <Label className="font-normal">必填条款</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.editable}
                onCheckedChange={(checked) => setFormData({ ...formData, editable: checked })}
              />
              <Label className="font-normal">允许编辑</Label>
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onSave(formData);
              onOpenChange(false);
            }}
            className="bg-amber-600 hover:bg-amber-700"
          >
            保存
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 加载状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 基本信息状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('tenant');
  const [isDefault, setIsDefault] = useState(false);

  // 样式配置状态
  const [styleConfig, setStyleConfig] = useState<TemplateStyleConfig>(defaultStyleConfig);

  // 条款状态
  const [clauses, setClauses] = useState<TemplateClause[]>([]);
  const [editingClause, setEditingClause] = useState<TemplateClause | null>(null);
  const [clauseDialogOpen, setClauseDialogOpen] = useState(false);

  // 保存状态
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 加载模板数据
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contract-templates?id=${templateId}`);
        const result = await response.json();

        if (result.success) {
          const template = result.data;
          setName(template.name);
          setDescription(template.description || '');
          setType(template.type);
          setIsDefault(template.isDefault);
          setStyleConfig(template.styleConfig || defaultStyleConfig);
          setClauses(template.clauses || []);
          setError(null);
        } else {
          setError(result.error || '加载模板失败');
        }
      } catch (err) {
        console.error('加载模板失败:', err);
        setError('加载模板失败');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  // 更新样式配置
  const updateStyleConfig = (key: keyof TemplateStyleConfig, value: any) => {
    setStyleConfig((prev) => ({ ...prev, [key]: value }));
  };

  // 更新嵌套的样式配置
  const updateNestedStyleConfig = (
    key: keyof TemplateStyleConfig,
    nestedKey: string,
    value: any
  ) => {
    setStyleConfig((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] as object),
        [nestedKey]: value,
      },
    }));
  };

  // 拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = clauses.findIndex((item) => item.id === active.id);
      const newIndex = clauses.findIndex((item) => item.id === over.id);
      const newClauses = arrayMove(clauses, oldIndex, newIndex).map((c, i) => ({
        ...c,
        order: i + 1,
      }));
      setClauses(newClauses);
    }
  };

  // 编辑条款
  const handleEditClause = (clause: TemplateClause) => {
    setEditingClause(clause);
    setClauseDialogOpen(true);
  };

  // 新增条款
  const handleAddClause = () => {
    setEditingClause(null);
    setClauseDialogOpen(true);
  };

  // 保存条款
  const handleSaveClause = (clause: TemplateClause) => {
    if (editingClause) {
      setClauses((prev) =>
        prev.map((c) => (c.id === clause.id ? clause : c))
      );
    } else {
      setClauses((prev) => [...prev, { ...clause, order: prev.length + 1 }]);
    }
  };

  // 删除条款
  const handleDeleteClause = (id: string) => {
    setClauses((prev) =>
      prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i + 1 }))
    );
  };

  // 保存模板
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请输入模板名称');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/contract-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateId,
          name,
          description,
          type,
          style_config: styleConfig,
          clauses,
          is_default: isDefault,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('模板更新成功');
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (err) {
      console.error('更新模板失败:', err);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出PDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      toast.info('正在生成PDF...');

      // 动态导入库
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // 创建预览内容的容器
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = styleConfig.orientation === 'portrait' ? '210mm' : '297mm';
      container.style.minHeight = styleConfig.orientation === 'portrait' ? '297mm' : '210mm';
      container.style.backgroundColor = 'white';
      container.style.padding = `${styleConfig.margins.top}mm ${styleConfig.margins.right}mm ${styleConfig.margins.bottom}mm ${styleConfig.margins.left}mm`;
      container.style.fontFamily = styleConfig.font.family;
      container.style.fontSize = `${styleConfig.font.size}pt`;
      container.style.lineHeight = String(styleConfig.font.lineHeight);
      container.style.color = styleConfig.colors.text;

      // 构建内容
      let content = '';

      // 页眉
      if (styleConfig.layout.showLogo) {
        content += `<div style="height: ${styleConfig.layout.headerHeight}px; text-align: ${styleConfig.layout.logoPosition}; background-color: ${styleConfig.colors.headerBg}; margin-bottom: 24px;">[Logo]</div>`;
      }

      // 标题
      content += `<h1 style="text-align: center; margin-bottom: 32px; font-family: ${styleConfig.titleFont.family}; font-size: ${styleConfig.titleFont.size}pt; font-weight: ${styleConfig.titleFont.weight}; color: ${styleConfig.colors.primary};">${name || '合同模板'}</h1>`;

      // 条款
      clauses.forEach((clause, index) => {
        content += `<div style="margin-bottom: ${styleConfig.clauseStyle.spacing}px; padding-left: ${styleConfig.clauseStyle.indent}px;">`;
        content += `<h3 style="font-weight: bold; margin-bottom: 8px; color: ${styleConfig.colors.primary};">${index + 1}. ${clause.title}</h3>`;
        content += `<p style="white-space: pre-line;">${clause.content}</p>`;
        content += `</div>`;
      });

      // 页脚
      if (styleConfig.layout.showPageNumber) {
        content += `<div style="margin-top: 32px; height: ${styleConfig.layout.footerHeight}px; text-align: ${styleConfig.layout.pageNumberPosition};">第 1 页</div>`;
      }

      container.innerHTML = content;
      document.body.appendChild(container);

      // 转换为canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // 移除临时容器
      document.body.removeChild(container);

      // 创建PDF
      const orientation = styleConfig.orientation === 'portrait' ? 'p' : 'l';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: styleConfig.pageSize.toLowerCase() === 'a5' ? 'a5' : styleConfig.pageSize.toLowerCase() === 'letter' ? 'letter' : 'a4',
      });

      // 计算图片尺寸
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 添加图片到PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // 下载PDF
      pdf.save(`${name || '合同模板'}.pdf`);
      toast.success('PDF导出成功');

    } catch (err) {
      console.error('导出PDF失败:', err);
      toast.error('导出失败');
    } finally {
      setExporting(false);
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
        <Button variant="outline" onClick={() => router.push('/dashboard/base/contracts/templates')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/base/contracts/templates')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-2xl font-semibold">编辑合同模板</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                导出PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存修改
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="style">样式配置</TabsTrigger>
          <TabsTrigger value="clauses">条款编辑</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>模板基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>模板名称 *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：园区入驻服务合同模板"
                  />
                </div>
                <div className="space-y-2">
                  <Label>模板类型</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">入驻合同</SelectItem>
                      <SelectItem value="service">服务合同</SelectItem>
                      <SelectItem value="lease">租赁合同</SelectItem>
                      <SelectItem value="other">其他合同</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>模板描述</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述该模板的用途和特点"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label className="font-normal">设为默认模板</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 样式配置 */}
        <TabsContent value="style" className="space-y-6">
          {/* 页面设置 */}
          <Card>
            <CardHeader>
              <CardTitle>页面设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>纸张大小</Label>
                  <Select
                    value={styleConfig.pageSize}
                    onValueChange={(value) => updateStyleConfig('pageSize', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>页面方向</Label>
                  <Select
                    value={styleConfig.orientation}
                    onValueChange={(value) => updateStyleConfig('orientation', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">纵向</SelectItem>
                      <SelectItem value="landscape">横向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>页边距 (mm)</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">上</Label>
                    <Input
                      type="number"
                      value={styleConfig.margins.top}
                      onChange={(e) => updateNestedStyleConfig('margins', 'top', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">右</Label>
                    <Input
                      type="number"
                      value={styleConfig.margins.right}
                      onChange={(e) => updateNestedStyleConfig('margins', 'right', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">下</Label>
                    <Input
                      type="number"
                      value={styleConfig.margins.bottom}
                      onChange={(e) => updateNestedStyleConfig('margins', 'bottom', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">左</Label>
                    <Input
                      type="number"
                      value={styleConfig.margins.left}
                      onChange={(e) => updateNestedStyleConfig('margins', 'left', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 字体设置 */}
          <Card>
            <CardHeader>
              <CardTitle>字体设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 正文字体 */}
              <div className="space-y-4">
                <h4 className="font-medium">正文字体</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>字体</Label>
                    <Select
                      value={styleConfig.font.family}
                      onValueChange={(value) => updateNestedStyleConfig('font', 'family', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>字号 (pt)</Label>
                    <Input
                      type="number"
                      value={styleConfig.font.size}
                      onChange={(e) => updateNestedStyleConfig('font', 'size', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>行高</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={styleConfig.font.lineHeight}
                      onChange={(e) => updateNestedStyleConfig('font', 'lineHeight', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 标题字体 */}
              <div className="space-y-4">
                <h4 className="font-medium">标题字体</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>字体</Label>
                    <Select
                      value={styleConfig.titleFont.family}
                      onValueChange={(value) => updateNestedStyleConfig('titleFont', 'family', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>字号 (pt)</Label>
                    <Input
                      type="number"
                      value={styleConfig.titleFont.size}
                      onChange={(e) => updateNestedStyleConfig('titleFont', 'size', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>字重</Label>
                    <Select
                      value={styleConfig.titleFont.weight}
                      onValueChange={(value) => updateNestedStyleConfig('titleFont', 'weight', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">常规</SelectItem>
                        <SelectItem value="bold">粗体</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 颜色设置 */}
          <Card>
            <CardHeader>
              <CardTitle>颜色设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>主色调</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styleConfig.colors.primary}
                      onChange={(e) => updateNestedStyleConfig('colors', 'primary', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styleConfig.colors.primary}
                      onChange={(e) => updateNestedStyleConfig('colors', 'primary', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>辅助色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styleConfig.colors.secondary}
                      onChange={(e) => updateNestedStyleConfig('colors', 'secondary', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styleConfig.colors.secondary}
                      onChange={(e) => updateNestedStyleConfig('colors', 'secondary', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>文字颜色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styleConfig.colors.text}
                      onChange={(e) => updateNestedStyleConfig('colors', 'text', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styleConfig.colors.text}
                      onChange={(e) => updateNestedStyleConfig('colors', 'text', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>边框颜色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styleConfig.colors.border}
                      onChange={(e) => updateNestedStyleConfig('colors', 'border', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styleConfig.colors.border}
                      onChange={(e) => updateNestedStyleConfig('colors', 'border', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>表头背景</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={styleConfig.colors.headerBg}
                      onChange={(e) => updateNestedStyleConfig('colors', 'headerBg', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={styleConfig.colors.headerBg}
                      onChange={(e) => updateNestedStyleConfig('colors', 'headerBg', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 布局设置 */}
          <Card>
            <CardHeader>
              <CardTitle>布局设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={styleConfig.layout.showLogo}
                    onCheckedChange={(checked) => updateNestedStyleConfig('layout', 'showLogo', checked)}
                  />
                  <Label className="font-normal">显示Logo</Label>
                </div>
                {styleConfig.layout.showLogo && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Logo位置</Label>
                    <Select
                      value={styleConfig.layout.logoPosition}
                      onValueChange={(value) => updateNestedStyleConfig('layout', 'logoPosition', value as any)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">左对齐</SelectItem>
                        <SelectItem value="center">居中</SelectItem>
                        <SelectItem value="right">右对齐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={styleConfig.layout.showPageNumber}
                    onCheckedChange={(checked) => updateNestedStyleConfig('layout', 'showPageNumber', checked)}
                  />
                  <Label className="font-normal">显示页码</Label>
                </div>
                {styleConfig.layout.showPageNumber && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">页码位置</Label>
                    <Select
                      value={styleConfig.layout.pageNumberPosition}
                      onValueChange={(value) => updateNestedStyleConfig('layout', 'pageNumberPosition', value as any)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">左对齐</SelectItem>
                        <SelectItem value="center">居中</SelectItem>
                        <SelectItem value="right">右对齐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>页眉高度 (px)</Label>
                  <Input
                    type="number"
                    value={styleConfig.layout.headerHeight}
                    onChange={(e) => updateNestedStyleConfig('layout', 'headerHeight', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>页脚高度 (px)</Label>
                  <Input
                    type="number"
                    value={styleConfig.layout.footerHeight}
                    onChange={(e) => updateNestedStyleConfig('layout', 'footerHeight', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 条款样式 */}
          <Card>
            <CardHeader>
              <CardTitle>条款样式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>编号样式</Label>
                  <Select
                    value={styleConfig.clauseStyle.numberingStyle}
                    onValueChange={(value) => updateNestedStyleConfig('clauseStyle', 'numberingStyle', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decimal">数字 (1, 2, 3)</SelectItem>
                      <SelectItem value="lower-alpha">小写字母 (a, b, c)</SelectItem>
                      <SelectItem value="upper-alpha">大写字母 (A, B, C)</SelectItem>
                      <SelectItem value="lower-roman">小写罗马 (i, ii, iii)</SelectItem>
                      <SelectItem value="upper-roman">大写罗马 (I, II, III)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>缩进 (px)</Label>
                  <Input
                    type="number"
                    value={styleConfig.clauseStyle.indent}
                    onChange={(e) => updateNestedStyleConfig('clauseStyle', 'indent', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>间距 (px)</Label>
                  <Input
                    type="number"
                    value={styleConfig.clauseStyle.spacing}
                    onChange={(e) => updateNestedStyleConfig('clauseStyle', 'spacing', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 条款编辑 */}
        <TabsContent value="clauses" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              管理合同模板的条款内容，拖拽可调整顺序
            </p>
            <Button onClick={handleAddClause} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              新增条款
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={clauses.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {clauses.map((clause) => (
                  <SortableClauseItem
                    key={clause.id}
                    clause={clause}
                    onEdit={handleEditClause}
                    onDelete={handleDeleteClause}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {clauses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>暂无条款</p>
              <p className="text-sm mt-1">点击上方"新增条款"添加</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 条款编辑对话框 */}
      <ClauseEditDialog
        clause={editingClause}
        open={clauseDialogOpen}
        onOpenChange={setClauseDialogOpen}
        onSave={handleSaveClause}
      />

      {/* 预览对话框 */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>模板预览</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                关闭
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[75vh]">
              <div
                className="bg-white shadow-lg mx-auto p-8"
                style={{
                  width: styleConfig.orientation === 'portrait' ? '210mm' : '297mm',
                  minHeight: styleConfig.orientation === 'portrait' ? '297mm' : '210mm',
                  fontFamily: styleConfig.font.family,
                  fontSize: `${styleConfig.font.size}pt`,
                  lineHeight: styleConfig.font.lineHeight,
                  color: styleConfig.colors.text,
                  paddingTop: `${styleConfig.margins.top}mm`,
                  paddingRight: `${styleConfig.margins.right}mm`,
                  paddingBottom: `${styleConfig.margins.bottom}mm`,
                  paddingLeft: `${styleConfig.margins.left}mm`,
                  transform: 'scale(0.6)',
                  transformOrigin: 'top left',
                }}
              >
                {/* 页眉 */}
                {styleConfig.layout.showLogo && (
                  <div
                    className="mb-6"
                    style={{
                      height: styleConfig.layout.headerHeight,
                      textAlign: styleConfig.layout.logoPosition as any,
                      backgroundColor: styleConfig.colors.headerBg,
                    }}
                  >
                    <span className="text-muted-foreground">[Logo 占位]</span>
                  </div>
                )}

                {/* 标题 */}
                <h1
                  className="text-center mb-8"
                  style={{
                    fontFamily: styleConfig.titleFont.family,
                    fontSize: `${styleConfig.titleFont.size}pt`,
                    fontWeight: styleConfig.titleFont.weight,
                    color: styleConfig.colors.primary,
                  }}
                >
                  {name || '合同模板'}
                </h1>

                {/* 条款 */}
                <div className="space-y-4">
                  {clauses.map((clause, index) => (
                    <div
                      key={clause.id}
                      style={{
                        marginBottom: `${styleConfig.clauseStyle.spacing}px`,
                        paddingLeft: `${styleConfig.clauseStyle.indent}px`,
                      }}
                    >
                      <h3 className="font-bold mb-2" style={{ color: styleConfig.colors.primary }}>
                        {index + 1}. {clause.title}
                      </h3>
                      <p className="whitespace-pre-line">{clause.content}</p>
                    </div>
                  ))}
                </div>

                {/* 页脚 */}
                {styleConfig.layout.showPageNumber && (
                  <div
                    className="mt-8"
                    style={{
                      height: styleConfig.layout.footerHeight,
                      textAlign: styleConfig.layout.pageNumberPosition as any,
                    }}
                  >
                    <span className="text-muted-foreground">第 1 页</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
