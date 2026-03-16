"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  CalendarClock,
  Eye,
  Upload,
  X,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Hash,
  AtSign,
  MapPin,
  Smile,
  Link2,
  Bold,
  Italic,
  List,
  AlignLeft,
  RotateCcw,
  History,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 平台配置
const PLATFORMS = [
  {
    id: "douyin",
    name: "抖音",
    icon: "🎬",
    color: "#000000",
    capabilities: {
      video: { support: true, limit: "15秒-15分钟", format: "MP4/MOV" },
      article: { support: false },
      dynamic: { support: true, limit: "2200字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "kuaishou",
    name: "快手",
    icon: "⚡",
    color: "#FF4906",
    capabilities: {
      video: { support: true, limit: "10秒-10分钟", format: "MP4/MOV" },
      article: { support: false },
      dynamic: { support: true, limit: "2000字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "wechat-mp",
    name: "微信公众号",
    icon: "📰",
    color: "#07C160",
    capabilities: {
      video: { support: false },
      article: { support: true, limit: "20000字", format: "图文" },
      dynamic: { support: false },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
    limitations: "订阅号每天1次群发，服务号每月4次",
  },
  {
    id: "toutiao",
    name: "今日头条",
    icon: "📱",
    color: "#FF0000",
    capabilities: {
      video: { support: true, limit: "1秒-30分钟", format: "MP4" },
      article: { support: true, limit: "50000字" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "baijiahao",
    name: "百家号",
    icon: "🔍",
    color: "#306CFF",
    capabilities: {
      video: { support: true, limit: "1秒-60分钟", format: "MP4" },
      article: { support: true, limit: "50000字" },
      dynamic: { support: false },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "weibo",
    name: "微博",
    icon: "🐦",
    color: "#FF8200",
    capabilities: {
      video: { support: true, limit: "15分钟", format: "MP4" },
      article: { support: true, limit: "10000字", format: "长微博" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "bilibili",
    name: "B站",
    icon: "📺",
    color: "#00A1D6",
    capabilities: {
      video: { support: true, limit: "无限制", format: "MP4/FLV" },
      article: { support: true, limit: "50000字", format: "专栏" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
    limitations: "需申请开放平台权限",
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    icon: "📕",
    color: "#FE2C55",
    capabilities: {
      video: { support: true, limit: "15分钟", format: "MP4" },
      article: { support: true, limit: "1000字", format: "笔记" },
      dynamic: { support: false },
      live: { support: true },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "API不开放，需手动发布",
  },
  {
    id: "channels",
    name: "视频号",
    icon: "📹",
    color: "#07C160",
    capabilities: {
      video: { support: true, limit: "1小时", format: "MP4" },
      article: { support: false },
      dynamic: { support: false },
      live: { support: true },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "通过微信内部发布，API受限",
  },
  {
    id: "zhihu",
    name: "知乎",
    icon: "💙",
    color: "#0066FF",
    capabilities: {
      video: { support: true, limit: "无限制", format: "MP4" },
      article: { support: true, limit: "无限制", format: "文章/回答" },
      dynamic: { support: true, limit: "无限制" },
      live: { support: false },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "发布API权限受限",
  },
];

// 发布记录模拟数据
const PUBLISH_HISTORY = [
  {
    id: "1",
    title: "代理记账常见问题解答",
    type: "article",
    platforms: ["微信公众号", "今日头条", "百家号"],
    status: "success",
    publishTime: "2024-01-15 10:30",
    views: 1234,
    likes: 89,
    comments: 23,
  },
  {
    id: "2",
    title: "公司注册流程详解",
    type: "video",
    platforms: ["抖音", "快手"],
    status: "reviewing",
    publishTime: "2024-01-15 14:00",
    views: 0,
    likes: 0,
    comments: 0,
  },
  {
    id: "3",
    title: "财税知识小课堂",
    type: "dynamic",
    platforms: ["微博", "今日头条"],
    status: "failed",
    publishTime: "2024-01-14 16:45",
    views: 0,
    likes: 0,
    comments: 0,
    error: "内容审核未通过：包含敏感词",
  },
  {
    id: "4",
    title: "创业者必看！营业执照办理指南",
    type: "video",
    platforms: ["抖音", "快手", "B站"],
    status: "success",
    publishTime: "2024-01-14 09:00",
    views: 5678,
    likes: 234,
    comments: 56,
  },
  {
    id: "5",
    title: "小微企业税收优惠政策解读",
    type: "article",
    platforms: ["微信公众号", "知乎"],
    status: "scheduled",
    publishTime: "2024-01-16 09:00",
    views: 0,
    likes: 0,
    comments: 0,
  },
];

// 内容类型
type ContentType = "article" | "video" | "dynamic";

// 发布状态
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  success: { label: "发布成功", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  reviewing: { label: "审核中", color: "bg-amber-100 text-amber-700", icon: <ClockIcon className="w-3.5 h-3.5" /> },
  failed: { label: "发布失败", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  scheduled: { label: "待发布", color: "bg-blue-100 text-blue-700", icon: <CalendarClock className="w-3.5 h-3.5" /> },
};

export default function ContentPublishPage() {
  const [contentType, setContentType] = useState<ContentType>("article");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 切换平台选择
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // 移除标签
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 获取字数统计
  const getWordCount = () => {
    return content.length;
  };

  // 获取支持当前内容类型的平台
  const getSupportedPlatforms = () => {
    return PLATFORMS.filter(p => p.capabilities[contentType]?.support);
  };

  // 发布内容
  const handlePublish = async () => {
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }
    if (!content.trim()) {
      alert("请输入内容");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("请选择发布平台");
      return;
    }

    setIsPublishing(true);
    
    // 模拟发布过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsPublishing(false);
    alert("发布成功！内容已提交至各平台审核。");
    
    // 重置表单
    setTitle("");
    setContent("");
    setSelectedPlatforms([]);
    setTags([]);
    setCoverImage(null);
    setVideoFile(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">内容发布</h1>
          <p className="text-sm text-slate-500 mt-1">一键发布内容至多个平台</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowHistory(true)}
          >
            <History className="h-4 w-4" />
            发布记录
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：内容编辑区 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* 内容类型选择 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">内容类型</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="article" className="gap-2">
                    <FileText className="h-4 w-4" />
                    图文
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="h-4 w-4" />
                    视频
                  </TabsTrigger>
                  <TabsTrigger value="dynamic" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    动态
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
                {contentType === "article" && (
                  <Badge variant="secondary" className="text-xs">
                    {getWordCount()} / 20000 字
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="请输入标题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
                <p className="text-xs text-slate-500">
                  {title.length}/100 字符
                </p>
              </div>

              {/* 封面图 */}
              {(contentType === "article" || contentType === "video") && (
                <div className="space-y-2">
                  <Label>封面图</Label>
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {coverImage ? (
                      <div className="relative inline-block">
                        <img 
                          src={coverImage} 
                          alt="封面预览" 
                          className="max-h-40 rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverImage(null);
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
                      if (file) {
                        setCoverImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              )}

              {/* 视频 */}
              {contentType === "video" && (
                <div className="space-y-2">
                  <Label>视频文件</Label>
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    {videoFile ? (
                      <div className="space-y-2">
                        <video 
                          src={videoFile} 
                          className="max-h-48 mx-auto rounded-lg"
                          controls
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                          }}
                        >
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
                      if (file) {
                        setVideoFile(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              )}

              {/* 正文 */}
              <div className="space-y-2">
                <Label htmlFor="content">正文</Label>
                
                {/* 工具栏 */}
                <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-t-lg border border-b-0 border-slate-200">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Hash className="h-4 w-4" />
                  </Button>
                </div>
                
                <Textarea
                  id="content"
                  placeholder={contentType === "article" ? "请输入正文内容..." : contentType === "dynamic" ? "分享你的想法..." : "请输入视频描述..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] rounded-t-none"
                />
              </div>

              {/* 标签 */}
              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="gap-1 px-2 py-1"
                    >
                      #{tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
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
                  <Button variant="outline" onClick={addTag}>
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-slate-500">推荐标签：</span>
                  {["代理记账", "公司注册", "财税知识", "创业", "营业执照"].map(tag => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        if (!tags.includes(tag)) {
                          setTags([...tags, tag]);
                        }
                      }}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：平台选择与发布设置 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* 平台选择 */}
          <Card className="border-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">发布平台</CardTitle>
                <Badge variant="secondary">
                  已选 {selectedPlatforms.length} 个
                </Badge>
              </div>
              <CardDescription>
                选择要发布的平台，灰色平台不支持当前内容类型
              </CardDescription>
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
                            {!isSupported && (
                              <p className="text-xs text-slate-400">不支持此类型</p>
                            )}
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

          {/* 发布设置 */}
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
                  checked={scheduledPublish}
                  onCheckedChange={setScheduledPublish}
                />
              </div>
              
              {scheduledPublish && (
                <div className="grid grid-cols-2 gap-3 pl-2">
                  <div className="space-y-2">
                    <Label className="text-xs">日期</Label>
                    <Input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">时间</Label>
                    <Input
                      type="time"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
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
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // 保存草稿逻辑
                alert("草稿已保存");
              }}
            >
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
              ) : scheduledPublish ? (
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
        </div>
      </div>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>内容预览</DialogTitle>
            <DialogDescription>
              预览内容在移动端的展示效果
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center">
            <div className="w-[320px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg">
              {/* 模拟手机顶部 */}
              <div className="h-6 bg-slate-100 flex items-center justify-center">
                <div className="w-16 h-1 bg-slate-300 rounded-full"></div>
              </div>
              
              {/* 内容区 */}
              <div className="p-4 space-y-3">
                {/* 封面 */}
                {coverImage && (
                  <img 
                    src={coverImage} 
                    alt="封面" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
                
                {/* 标题 */}
                <h3 className="font-bold text-lg">
                  {title || "未输入标题"}
                </h3>
                
                {/* 内容 */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {content || "未输入内容"}
                </p>
                
                {/* 标签 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                      <span key={i} className="text-xs text-blue-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 平台信息 */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    将发布至：{selectedPlatforms.length > 0 
                      ? PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => p.name).join("、")
                      : "未选择平台"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发布历史对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>发布记录</DialogTitle>
            <DialogDescription>
              查看历史发布记录和状态
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {PUBLISH_HISTORY.map((record) => (
              <div 
                key={record.id}
                className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* 封面缩略图 */}
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {record.type === "video" ? (
                    <Video className="h-6 w-6 text-slate-400" />
                  ) : record.type === "article" ? (
                    <FileText className="h-6 w-6 text-slate-400" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                
                {/* 内容信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 truncate">{record.title}</h4>
                    <Badge className={cn("text-xs gap-1", STATUS_CONFIG[record.status].color)}>
                      {STATUS_CONFIG[record.status].icon}
                      {STATUS_CONFIG[record.status].label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>{record.publishTime}</span>
                    <span>•</span>
                    <span>{record.platforms.join("、")}</span>
                  </div>
                  
                  {record.status === "failed" && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {record.error}
                    </p>
                  )}
                  
                  {record.status === "success" && (
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>👁 {record.views}</span>
                      <span>👍 {record.likes}</span>
                      <span>💬 {record.comments}</span>
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  {record.status === "scheduled" && (
                    <Button variant="outline" size="sm">
                      取消
                    </Button>
                  )}
                  {record.status === "failed" && (
                    <Button variant="outline" size="sm">
                      重新发布
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    查看
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
