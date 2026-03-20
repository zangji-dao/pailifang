"use client";

import { useRef } from "react";
import {
  Image as ImageIcon,
  Video,
  X,
  Bold,
  Italic,
  List,
  AlignLeft,
  Link2,
  AtSign,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ContentType, PublishFormData } from "../types";
import { CONTENT_TYPE_CONFIG, RECOMMENDED_TAGS, WORD_LIMITS } from "../constants";

interface ContentEditorProps {
  formData: PublishFormData;
  tagInput: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  setContentType: (type: ContentType) => void;
  updateField: <K extends keyof PublishFormData>(field: K, value: PublishFormData[K]) => void;
  setTagInput: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  addRecommendedTag: (tag: string) => void;
  handleCoverUpload: (file: File) => void;
  removeCoverImage: () => void;
  handleVideoUpload: (file: File) => void;
  removeVideo: () => void;
  getWordCount: () => number;
}

export function ContentEditor({
  formData,
  tagInput,
  fileInputRef,
  videoInputRef,
  setContentType,
  updateField,
  setTagInput,
  addTag,
  removeTag,
  addRecommendedTag,
  handleCoverUpload,
  removeCoverImage,
  handleVideoUpload,
  removeVideo,
  getWordCount,
}: ContentEditorProps) {
  const wordCount = getWordCount();
  const wordLimit = WORD_LIMITS[formData.contentType];

  return (
    <>
      {/* 内容类型选择 */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">内容类型</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={formData.contentType} onValueChange={(v) => setContentType(v as ContentType)}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="article" className="gap-2">
                <span className="h-4 w-4">📄</span>
                {CONTENT_TYPE_CONFIG.article.label}
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <span className="h-4 w-4">🎬</span>
                {CONTENT_TYPE_CONFIG.video.label}
              </TabsTrigger>
              <TabsTrigger value="dynamic" className="gap-2">
                <span className="h-4 w-4">✨</span>
                {CONTENT_TYPE_CONFIG.dynamic.label}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* 内容编辑 */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">内容编辑</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {wordCount} / {wordLimit} 字
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              placeholder="请输入标题..."
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="text-lg font-medium"
            />
            <p className="text-xs text-slate-500">{formData.title.length}/100 字符</p>
          </div>

          {/* 封面图 */}
          {(formData.contentType === "article" || formData.contentType === "video") && (
            <div className="space-y-2">
              <Label>封面图</Label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.coverImage ? (
                  <div className="relative inline-block">
                    <img src={formData.coverImage} alt="封面预览" className="max-h-40 rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCoverImage();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-sm text-slate-600">点击上传封面图</p>
                    <p className="text-xs text-slate-400">支持 JPG、PNG，建议尺寸 16:9</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
            </div>
          )}

          {/* 视频 */}
          {formData.contentType === "video" && (
            <div className="space-y-2">
              <Label>视频文件</Label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                {formData.videoFile ? (
                  <div className="space-y-2">
                    <video src={formData.videoFile} className="max-h-48 mx-auto rounded-lg" controls />
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); removeVideo(); }}>
                      <X className="h-4 w-4 mr-2" />
                      移除视频
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Video className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-sm text-slate-600">点击上传视频</p>
                    <p className="text-xs text-slate-400">支持 MP4、MOV，最大 500MB</p>
                  </div>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
              />
            </div>
          )}

          {/* 正文 */}
          <div className="space-y-2">
            <Label htmlFor="content">正文</Label>
            {/* 工具栏 */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-t-lg border border-b-0 border-slate-200">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8"><AlignLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Link2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><AtSign className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Hash className="h-4 w-4" /></Button>
            </div>
            <Textarea
              id="content"
              placeholder={
                formData.contentType === "article"
                  ? "请输入正文内容..."
                  : formData.contentType === "dynamic"
                  ? "分享你的想法..."
                  : "请输入视频描述..."
              }
              value={formData.content}
              onChange={(e) => updateField("content", e.target.value)}
              className="min-h-[300px] rounded-t-none"
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1 px-2 py-1">
                  #{tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签后回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button variant="outline" onClick={addTag}>添加</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-slate-500">推荐标签：</span>
              {RECOMMENDED_TAGS.map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addRecommendedTag(tag)}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
