"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Send,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Image,
  Smile,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  User,
  RefreshCw,
  Filter,
  Archive,
  Star,
  StarOff,
} from "lucide-react";

// 平台配置
const platforms = [
  { id: "all", name: "全部", icon: "💬", color: "bg-slate-500" },
  { id: "douyin", name: "抖音", icon: "🎬", color: "bg-pink-500", canReply: true },
  { id: "wechat_mp", name: "公众号", icon: "📱", color: "bg-green-500", canReply: true },
  { id: "wechat_mini", name: "小程序", icon: "📱", color: "bg-green-600", canReply: true },
  { id: "wework", name: "企业微信", icon: "💼", color: "bg-blue-500", canReply: true },
  { id: "kuaishou", name: "快手", icon: "🎥", color: "bg-orange-500", canReply: true },
  { id: "xiaohongshu", name: "小红书", icon: "📕", color: "bg-red-500", canReply: false },
  { id: "zhihu", name: "知乎", icon: "💡", color: "bg-blue-600", canReply: false },
  { id: "bilibili", name: "B站", icon: "📺", color: "bg-cyan-500", canReply: false },
];

// 模拟会话列表
const mockConversations = [
  {
    id: "1",
    platform: "douyin",
    userName: "张先生",
    userAvatar: null,
    lastMessage: "请问代理记账一个月多少钱？",
    lastMessageTime: "10:30",
    unreadCount: 2,
    starred: true,
    status: "waiting",
  },
  {
    id: "2",
    platform: "wechat_mp",
    userName: "李女士",
    userAvatar: null,
    lastMessage: "好的，我已经加您微信了",
    lastMessageTime: "09:45",
    unreadCount: 0,
    starred: false,
    status: "replied",
  },
  {
    id: "3",
    platform: "wework",
    userName: "王总",
    userAvatar: null,
    lastMessage: "那我们约明天下午3点见面",
    lastMessageTime: "昨天",
    unreadCount: 0,
    starred: true,
    status: "replied",
  },
  {
    id: "4",
    platform: "xiaohongshu",
    userName: "赵经理",
    userAvatar: null,
    lastMessage: "请问公司注册需要什么材料？",
    lastMessageTime: "昨天",
    unreadCount: 1,
    starred: false,
    status: "waiting",
    canReply: false,
  },
  {
    id: "5",
    platform: "kuaishou",
    userName: "孙女士",
    userAvatar: null,
    lastMessage: "收到，我看看报价单",
    lastMessageTime: "前天",
    unreadCount: 0,
    starred: false,
    status: "replied",
  },
  {
    id: "6",
    platform: "wechat_mini",
    userName: "周总",
    userAvatar: null,
    lastMessage: "商标注册大概需要多长时间？",
    lastMessageTime: "前天",
    unreadCount: 3,
    starred: true,
    status: "waiting",
  },
];

// 模拟聊天记录
const mockMessages = [
  {
    id: "1",
    sender: "user",
    content: "你好，请问代理记账一个月多少钱？",
    time: "10:25",
    platform: "douyin",
  },
  {
    id: "2",
    sender: "system",
    content: "【自动回复】您好！感谢您的咨询。代理记账费用根据公司类型和业务量不同，小规模纳税人每月200-500元，一般纳税人每月500-1500元。稍后会有专人联系您详细沟通~",
    time: "10:25",
    isAutoReply: true,
  },
  {
    id: "3",
    sender: "user",
    content: "小规模纳税人，没什么业务",
    time: "10:28",
    platform: "douyin",
  },
  {
    id: "4",
    sender: "user",
    content: "大概是多少钱？",
    time: "10:30",
    platform: "douyin",
  },
];

// 快捷回复模板
const quickReplies = [
  "您好，请问您的公司类型是？",
  "小规模纳税人每月200元起，一般纳税人每月500元起",
  "好的，稍后会有专人与您联系",
  "请问您的联系方式是？",
  "感谢您的咨询，再见！",
];

// 自动回复规则
const autoReplyRules = [
  { keyword: "价格", reply: "代理记账小规模200元/月起，一般纳税人500元/月起，具体根据业务量定价~" },
  { keyword: "多少钱", reply: "代理记账小规模200元/月起，一般纳税人500元/月起，具体根据业务量定价~" },
  { keyword: "材料", reply: "公司注册需要：法人身份证、股东身份证、注册地址证明、公司章程等材料" },
  { keyword: "时间", reply: "公司注册一般3-5个工作日，商标注册6-8个月，代理记账次月开始服务" },
];

export default function MessagesPage() {
  const [activePlatform, setActivePlatform] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getPlatformInfo = (platformId: string) => {
    return platforms.find((p) => p.id === platformId) || platforms[0];
  };

  const filteredConversations = mockConversations.filter((conv) => {
    const matchPlatform = activePlatform === "all" || conv.platform === activePlatform;
    const matchSearch = conv.userName.includes(searchQuery);
    return matchPlatform && matchSearch;
  });

  const canReplyToPlatform = (platformId: string) => {
    const platform = platforms.find((p) => p.id === platformId);
    return platform?.canReply !== false;
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // 发送消息逻辑
    console.log("Sending message:", messageInput);
    setMessageInput("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">统一消息中心</h1>
          <p className="text-slate-500 mt-1">聚合各平台消息，统一回复管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bot className="h-4 w-4 mr-2" />
            自动回复设置
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            同步消息
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左侧：会话列表 */}
        <Card className="w-80 flex-shrink-0 border-slate-200/60 flex flex-col">
          <CardHeader className="pb-2 px-4 pt-4">
            {/* 平台筛选 */}
            <div className="flex flex-wrap gap-1 mb-3">
              {platforms.slice(0, 6).map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setActivePlatform(platform.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    activePlatform === platform.id
                      ? `${platform.color} text-white`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {platform.icon} {platform.name}
                </button>
              ))}
            </div>
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索会话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-2 pb-2">
                {filteredConversations.map((conv) => {
                  const platformInfo = getPlatformInfo(conv.platform);
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-amber-50 border border-amber-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-slate-100 text-slate-600">
                            {conv.userName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                          {platformInfo.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-900 truncate">
                            {conv.userName}
                          </span>
                          <span className="text-xs text-slate-400">{conv.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                          {conv.unreadCount > 0 && (
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {conv.starred && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 absolute top-1 right-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 右侧：聊天详情 */}
        <Card className="flex-1 border-slate-200/60 flex flex-col">
          {selectedConversation ? (
            <>
              {/* 聊天头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {selectedConversation.userName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{selectedConversation.userName}</span>
                      <span className="text-sm">{getPlatformInfo(selectedConversation.platform).icon}</span>
                      <Badge variant="outline" className="text-xs">
                        {getPlatformInfo(selectedConversation.platform).name}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {selectedConversation.status === "waiting" ? "等待回复" : "已回复"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className={`h-4 w-4 ${selectedConversation.starred ? "text-amber-500 fill-amber-500" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        msg.sender === "user"
                          ? "bg-slate-100 text-slate-900"
                          : "bg-amber-500 text-white"
                      } rounded-2xl px-4 py-2`}
                    >
                      {msg.isAutoReply && (
                        <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                          <Bot className="h-3 w-3" />
                          自动回复
                        </div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-slate-400" : "text-white/70"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 快捷回复 */}
              <div className="px-4 py-2 border-t border-slate-200/60 overflow-x-auto">
                <div className="flex gap-2">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessageInput(reply)}
                      className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 whitespace-nowrap"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* 输入区域 */}
              <div className="p-3 border-t border-slate-200/60">
                {!canReplyToPlatform(selectedConversation.platform) ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {getPlatformInfo(selectedConversation.platform).name} 不支持API回复，请前往APP回复
                    </span>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Image className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Paperclip className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Smile className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                      <Input
                        placeholder="输入消息..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="resize-none"
                      />
                    </div>
                    <Button onClick={handleSendMessage} className="h-10">
                      <Send className="h-4 w-4 mr-1" />
                      发送
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>选择一个会话开始聊天</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
