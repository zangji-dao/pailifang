'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TemplateVariable,
  VariableCategory,
  VariableType,
  VariableCategoryLabels,
  VariableTypeLabels,
  PresetVariables,
  getVariablesByCategory,
} from '@/types/template-variable';
import {
  Search,
  Plus,
  X,
  Building2,
  FileText,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Check,
} from 'lucide-react';

interface VariablePoolProps {
  selectedVariables: TemplateVariable[];
  onSelectionChange: (variables: TemplateVariable[]) => void;
}

const CategoryIcons: Record<VariableCategory, React.ReactNode> = {
  enterprise: <Building2 className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  contact: <Phone className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  custom: <Settings className="h-4 w-4" />,
};

export function VariablePool({
  selectedVariables,
  onSelectionChange,
}: VariablePoolProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<VariableCategory | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({
    name: '',
    key: '',
    type: 'text',
    category: 'custom',
    placeholder: '',
  });

  // 过滤变量
  const filteredVariables = useMemo(() => {
    let vars = PresetVariables;
    
    if (activeCategory !== 'all') {
      vars = getVariablesByCategory(activeCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      vars = vars.filter(
        v => v.name.toLowerCase().includes(term) || 
             v.key.toLowerCase().includes(term)
      );
    }
    
    return vars;
  }, [activeCategory, searchTerm]);

  // 检查是否已选择
  const isSelected = (key: string) => {
    return selectedVariables.some(v => v.key === key);
  };

  // 切换选择
  const toggleVariable = (variable: TemplateVariable) => {
    if (isSelected(variable.key)) {
      onSelectionChange(selectedVariables.filter(v => v.key !== variable.key));
    } else {
      onSelectionChange([...selectedVariables, variable]);
    }
  };

  // 添加自定义变量
  const handleAddCustomVariable = () => {
    if (!newVariable.name || !newVariable.key) return;

    const customVar: TemplateVariable = {
      id: `var_custom_${Date.now()}`,
      name: newVariable.name,
      key: newVariable.key,
      type: newVariable.type || 'text',
      category: 'custom',
      placeholder: newVariable.placeholder,
    };

    onSelectionChange([...selectedVariables, customVar]);
    setShowAddDialog(false);
    setNewVariable({
      name: '',
      key: '',
      type: 'text',
      category: 'custom',
      placeholder: '',
    });
  };

  // 移除已选变量
  const removeVariable = (key: string) => {
    onSelectionChange(selectedVariables.filter(v => v.key !== key));
  };

  // 快速添加一类变量
  const addCategoryVariables = (category: VariableCategory) => {
    const categoryVars = getVariablesByCategory(category);
    const newVars = categoryVars.filter(v => !isSelected(v.key));
    onSelectionChange([...selectedVariables, ...newVars]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 已选变量 */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">已选变量 ({selectedVariables.length})</h3>
          {selectedVariables.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSelectionChange([])}
              className="text-xs h-7"
            >
              清空
            </Button>
          )}
        </div>
        {selectedVariables.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            请从下方选择需要填充的变量
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedVariables.map((variable) => (
              <Badge
                key={variable.key}
                variant="secondary"
                className="px-2 py-1 text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => removeVariable(variable.key)}
              >
                {variable.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 变量选择区域 */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="preset" className="h-full flex flex-col">
          <div className="px-4 pt-3 border-b">
            <TabsList className="w-full">
              <TabsTrigger value="preset" className="flex-1">预设变量</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">自定义变量</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preset" className="flex-1 overflow-hidden mt-0">
            <div className="h-full flex flex-col">
              {/* 搜索和分类 */}
              <div className="p-3 space-y-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索变量..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={activeCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('all')}
                    className="text-xs h-7"
                  >
                    全部
                  </Button>
                  {(Object.keys(VariableCategoryLabels) as VariableCategory[]).map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className="text-xs h-7"
                    >
                      {CategoryIcons[cat]}
                      <span className="ml-1">{VariableCategoryLabels[cat]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 变量列表 */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {filteredVariables.map((variable) => (
                    <div
                      key={variable.id}
                      className={`
                        flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                        ${isSelected(variable.key) 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted border border-transparent'}
                      `}
                      onClick={() => toggleVariable(variable)}
                    >
                      <Checkbox
                        checked={isSelected(variable.key)}
                        onCheckedChange={() => toggleVariable(variable)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{variable.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {VariableTypeLabels[variable.type]}
                          </Badge>
                          {variable.required && (
                            <span className="text-destructive text-xs">*</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {variable.key}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加自定义变量
                </Button>

                {/* 已添加的自定义变量 */}
                {selectedVariables.filter(v => v.category === 'custom').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">已添加的自定义变量</h4>
                    {selectedVariables
                      .filter(v => v.category === 'custom')
                      .map((variable) => (
                        <div
                          key={variable.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-sm">{variable.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {variable.key}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(variable.key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 添加自定义变量对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加自定义变量</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>变量名称 *</Label>
              <Input
                value={newVariable.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewVariable({
                    ...newVariable,
                    name,
                    key: name ? name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w\u4e00-\u9fa5]/g, '') : '',
                  });
                }}
                placeholder="如：项目负责人"
              />
            </div>
            <div>
              <Label>变量标识 *</Label>
              <Input
                value={newVariable.key}
                onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
                placeholder="如：project_manager"
              />
              <p className="text-xs text-muted-foreground mt-1">
                用于系统识别，建议使用英文下划线格式
              </p>
            </div>
            <div>
              <Label>变量类型</Label>
              <Select
                value={newVariable.type}
                onValueChange={(value) => setNewVariable({ ...newVariable, type: value as VariableType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文本</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                  <SelectItem value="date">日期</SelectItem>
                  <SelectItem value="money">金额</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>输入提示</Label>
              <Input
                value={newVariable.placeholder}
                onChange={(e) => setNewVariable({ ...newVariable, placeholder: e.target.value })}
                placeholder="如：请输入项目负责人姓名"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddCustomVariable} disabled={!newVariable.name || !newVariable.key}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
