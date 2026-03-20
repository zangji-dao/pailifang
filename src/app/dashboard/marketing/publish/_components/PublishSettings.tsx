"use client";

import { CalendarClock, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { PublishFormData } from "../types";

interface PublishSettingsProps {
  formData: PublishFormData;
  isPublishing: boolean;
  updateField: <K extends keyof PublishFormData>(field: K, value: PublishFormData[K]) => void;
  handlePublish: () => Promise<void>;
  handleSaveDraft: () => void;
}

export function PublishSettings({
  formData,
  isPublishing,
  updateField,
  handlePublish,
  handleSaveDraft,
}: PublishSettingsProps) {
  return (
    <>
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">发布设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 定时发布 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                定时发布
              </Label>
              <p className="text-xs text-slate-500">设置发布时间</p>
            </div>
            <Switch
              checked={formData.scheduledPublish}
              onCheckedChange={(checked) => updateField("scheduledPublish", checked)}
            />
          </div>

          {formData.scheduledPublish && (
            <div className="grid grid-cols-2 gap-3 pl-2">
              <div className="space-y-2">
                <Label className="text-xs">日期</Label>
                <Input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => updateField("publishDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">时间</Label>
                <Input
                  type="time"
                  value={formData.publishTime}
                  onChange={(e) => updateField("publishTime", e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* 其他设置 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">允许评论</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">允许转发</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">原创声明</Label>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 发布按钮 */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleSaveDraft}>
          保存草稿
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              发布中...
            </>
          ) : formData.scheduledPublish ? (
            <>
              <CalendarClock className="h-4 w-4 mr-2" />
              定时发布
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              立即发布
            </>
          )}
        </Button>
      </div>
    </>
  );
}
