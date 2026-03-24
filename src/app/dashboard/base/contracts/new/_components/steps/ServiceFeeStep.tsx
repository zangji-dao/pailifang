"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

// 场地类型配置（根据合同范本）
export const spaceTypeOptions = [
  {
    value: "open_station",
    label: "开放工位",
    price: 1200,
    unit: "个/年",
    description: "固定工位，共享办公区域",
    icon: "🏢",
  },
  {
    value: "office_no_window",
    label: "独立办公室（无窗）",
    price: 3000,
    unit: "间/年",
    description: "独立办公空间，无窗户",
    icon: "🚪",
  },
  {
    value: "office_with_window",
    label: "独立办公室（有窗）",
    price: 3600,
    unit: "间/年",
    description: "独立办公空间，带窗户",
    icon: "🪟",
  },
  {
    value: "detached_office",
    label: "独栋办公室",
    price: 3600,
    unit: "栋/年",
    description: "独立独栋办公空间",
    icon: "🏠",
  },
];

interface ServiceFeeStepProps {
  spaceType: string;
  spaceQuantity: number;
  yearlyFee: number;
  onSelectSpaceType: (spaceType: typeof spaceTypeOptions[0]) => void;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateYearlyFee: (fee: number) => void;
}

export function ServiceFeeStep({
  spaceType,
  spaceQuantity,
  yearlyFee,
  onSelectSpaceType,
  onUpdateQuantity,
  onUpdateYearlyFee,
}: ServiceFeeStepProps) {
  const selectedSpace = spaceTypeOptions.find(s => s.value === spaceType);

  return (
    <div className="space-y-6">
      {/* 场地类型选择 */}
      <div className="grid grid-cols-2 gap-4">
        {spaceTypeOptions.map((space) => (
          <Card
            key={space.value}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              spaceType === space.value
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onSelectSpaceType(space)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{space.icon}</span>
                  <CardTitle className="text-lg">{space.label}</CardTitle>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    spaceType === space.value ? "border-primary bg-primary" : "border-border"
                  )}
                >
                  {spaceType === space.value && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
              </div>
              <CardDescription>{space.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">¥{space.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{space.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 数量和费用计算 */}
      {selectedSpace && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              服务费计算
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>场地类型</Label>
                <div className="mt-1.5 p-2 border rounded-md bg-background">
                  {selectedSpace.label}
                </div>
              </div>
              <div>
                <Label>数量</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1.5"
                  value={spaceQuantity}
                  onChange={(e) => onUpdateQuantity(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>首年服务费（元）</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={yearlyFee}
                  onChange={(e) => onUpdateYearlyFee(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">计算公式：</span>
              <span className="text-sm">
                {selectedSpace.label} × {spaceQuantity} = ¥{selectedSpace.price * spaceQuantity}
                {yearlyFee !== selectedSpace.price * spaceQuantity && (
                  <span className="text-primary ml-2">（已调整为 ¥{yearlyFee.toLocaleString()}）</span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
