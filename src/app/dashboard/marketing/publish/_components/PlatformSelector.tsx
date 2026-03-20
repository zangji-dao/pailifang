"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ContentType } from "../types";
import { PLATFORMS } from "../constants";

interface PlatformSelectorProps {
  contentType: ContentType;
  selectedPlatforms: string[];
  togglePlatform: (platformId: string) => void;
}

export function PlatformSelector({
  contentType,
  selectedPlatforms,
  togglePlatform,
}: PlatformSelectorProps) {
  return (
    <Card className="border-slate-200/60">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">发布平台</CardTitle>
          <Badge variant="secondary">已选 {selectedPlatforms.length} 个</Badge>
        </div>
        <CardDescription>选择要发布的平台，灰色平台不支持当前内容类型</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-2">
            {PLATFORMS.map((platform) => {
              const isSupported = platform.capabilities[contentType]?.support;
              const isSelected = selectedPlatforms.includes(platform.id);
              const canAutoPublish = platform.autoPublish;

              return (
                <div
                  key={platform.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    isSupported
                      ? isSelected
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 hover:border-amber-300 hover:bg-slate-50"
                      : "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                  )}
                  onClick={() => isSupported && togglePlatform(platform.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{platform.name}</span>
                        {isSupported && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              canAutoPublish
                                ? "border-emerald-200 text-emerald-600"
                                : "border-amber-200 text-amber-600"
                            )}
                          >
                            {canAutoPublish ? "API发布" : "手动发布"}
                          </Badge>
                        )}
                      </div>
                      {isSupported && (
                        <p className="text-xs text-slate-500">
                          {platform.capabilities[contentType]?.limit || "支持"}
                        </p>
                      )}
                      {!isSupported && <p className="text-xs text-slate-400">不支持此类型</p>}
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    disabled={!isSupported}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* API支持提示 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">API发布说明</p>
              <ul className="space-y-1 text-blue-600">
                <li>• API发布的内容需经过平台审核</li>
                <li>• 小红书、视频号需手动前往APP发布</li>
                <li>• 各平台有发布频率限制</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
