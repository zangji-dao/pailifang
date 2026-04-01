"use client";

import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Base } from "../types";

interface BasicInfoStepProps {
  name: string;
  description: string;
  type: string;
  baseId: string;
  isDefault: boolean;
  bases: Base[];
  loadingBases: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTypeChange: (type: string) => void;
  onBaseChange: (baseId: string) => void;
  onDefaultChange: (isDefault: boolean) => void;
}

export function BasicInfoStep({
  name,
  description,
  type,
  baseId,
  isDefault,
  bases,
  loadingBases,
  onNameChange,
  onDescriptionChange,
  onTypeChange,
  onBaseChange,
  onDefaultChange,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>模板信息</CardTitle>
          <CardDescription>填写合同模板的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>模板名称 *</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="输入模板名称"
            />
          </div>
          
          <div className="space-y-2">
            <Label>所属基地</Label>
            <Select value={baseId} onValueChange={onBaseChange}>
              <SelectTrigger>
                <SelectValue placeholder={loadingBases ? "加载中..." : "选择所属基地"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无</SelectItem>
                {bases.map((base) => (
                  <SelectItem key={base.id} value={base.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {base.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>模板类型</Label>
            <Select value={type} onValueChange={onTypeChange}>
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

          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>设为默认模板</Label>
              <p className="text-sm text-muted-foreground">
                该类型合同默认使用此模板
              </p>
            </div>
            <Switch
              checked={isDefault}
              onCheckedChange={onDefaultChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>模板描述</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="描述该模板的用途和特点"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
