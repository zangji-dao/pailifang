"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Plus, Trash2, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// 常见押金类型
export const depositTypes = [
  { value: "space_deposit", label: "场地押金" },
  { value: "utility_deposit", label: "水电押金" },
  { value: "key_deposit", label: "钥匙/门禁押金" },
  { value: "equipment_deposit", label: "设备押金" },
  { value: "other", label: "其他押金" },
];

// 押金项接口
export interface DepositItem {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  remark?: string;
}

interface DepositStepProps {
  spaceType: string;
  spaceQuantity: number;
  baseDeposit: number;
  depositItems: DepositItem[];
  onUpdateBaseDeposit: (amount: number) => void;
  onAddDepositItem: (item: DepositItem) => void;
  onUpdateDepositItem: (id: string, updates: Partial<DepositItem>) => void;
  onRemoveDepositItem: (id: string) => void;
}

// 根据场地类型获取默认押金
const getDefaultDeposit = (spaceType: string): number => {
  const depositMap: Record<string, number> = {
    open_station: 1200,
    office_no_window: 1200,
    office_with_window: 1200,
    detached_office: 5000,
  };
  return depositMap[spaceType] || 1200;
};

export function DepositStep({
  spaceType,
  spaceQuantity,
  baseDeposit,
  depositItems,
  onUpdateBaseDeposit,
  onAddDepositItem,
  onUpdateDepositItem,
  onRemoveDepositItem,
}: DepositStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemType, setNewItemType] = useState("utility_deposit");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemRemark, setNewItemRemark] = useState("");

  // 计算总押金
  const totalDeposit = baseDeposit + depositItems.reduce((sum, item) => sum + item.amount, 0);

  // 添加押金项
  const handleAddItem = () => {
    if (!newItemAmount || Number(newItemAmount) <= 0) return;

    const typeInfo = depositTypes.find(t => t.value === newItemType);
    onAddDepositItem({
      id: `deposit_${Date.now()}`,
      type: newItemType,
      typeLabel: typeInfo?.label || newItemType,
      amount: Number(newItemAmount),
      remark: newItemRemark || undefined,
    });

    // 重置表单
    setNewItemType("utility_deposit");
    setNewItemAmount("");
    setNewItemRemark("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* 基础押金 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-primary" />
            场地押金
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            根据场地类型自动计算，可手动调整
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>场地类型押金标准</Label>
              <div className="mt-1.5 p-2 border rounded-md bg-muted/50 text-muted-foreground">
                ¥{getDefaultDeposit(spaceType)} / 单位
              </div>
            </div>
            <div>
              <Label>数量</Label>
              <div className="mt-1.5 p-2 border rounded-md bg-muted/50">
                {spaceQuantity}
              </div>
            </div>
            <div>
              <Label>场地押金金额（元）</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={baseDeposit}
                onChange={(e) => onUpdateBaseDeposit(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t text-sm">
            <span className="text-muted-foreground">计算公式：</span>
            <span>
              ¥{getDefaultDeposit(spaceType)} × {spaceQuantity} = ¥{getDefaultDeposit(spaceType) * spaceQuantity}
              {baseDeposit !== getDefaultDeposit(spaceType) * spaceQuantity && (
                <span className="text-primary ml-2">（已调整为 ¥{baseDeposit.toLocaleString()}）</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 其他押金项 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-primary" />
              其他押金
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm}
            >
              <Plus className="w-4 h-4 mr-1" />
              添加押金项
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            如水电押金、钥匙押金、设备押金等
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 添加新押金项表单 */}
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>押金类型</Label>
                  <Select value={newItemType} onValueChange={setNewItemType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {depositTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>金额（元）</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="输入金额"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>备注（选填）</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="备注说明"
                    value={newItemRemark}
                    onChange={(e) => setNewItemRemark(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleAddItem} disabled={!newItemAmount || Number(newItemAmount) <= 0}>
                  确认添加
                </Button>
              </div>
            </div>
          )}

          {/* 押金项列表 */}
          {depositItems.length > 0 ? (
            <div className="space-y-3">
              {depositItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.typeLabel}</p>
                      {item.remark && (
                        <p className="text-sm text-muted-foreground">{item.remark}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      className="w-32"
                      value={item.amount}
                      onChange={(e) => onUpdateDepositItem(item.id, { amount: Number(e.target.value) || 0 })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveDepositItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showAddForm && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p>暂无其他押金项</p>
                <p className="text-xs mt-1">点击上方按钮添加</p>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* 押金汇总 */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-primary" />
            押金汇总
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">场地押金</span>
              <span className="font-medium">¥{baseDeposit.toLocaleString()}</span>
            </div>
            {depositItems.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">{item.typeLabel}</span>
                <span className="font-medium">¥{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t text-base">
              <span className="font-medium">押金合计</span>
              <span className="font-bold text-primary text-lg">¥{totalDeposit.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * 押金于合同终止后30日内无息退还（扣除违约赔偿金）
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
