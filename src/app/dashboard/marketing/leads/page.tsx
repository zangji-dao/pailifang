"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Building2,
  User,
  MoreVertical,
  PhoneCall,
  Send,
  Calendar,
  Tag,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
} from "lucide-react";

// 线索状态
const leadStatuses = [
  { id: "new", name: "新线索", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  { id: "contacted", name: "已联系", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  { id: "following", name: "跟进中", color: "bg-amber-100 text-amber-700", icon: Timer },
  { id: "converted", name: "已转化", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  { id: "lost", name: "已流失", color: "bg-slate-100 text-slate-500", icon: XCircle },
];

// 渠道类型
const channelOptions = [
  { id: "douyin", name: "抖音", icon: "🎬" },
  { id: "wechat", name: "微信", icon: "📱" },
  { id: "xiaohongshu", name: "小红书", icon: "📕" },
  { id: "baidu", name: "百度SEM", icon: "🔍" },
  { id: "referral", name: "转介绍", icon: "🤝" },
  { id: "other", name: "其他", icon: "📌" },
];

// 模拟线索数据
const mockLeads = [
  {
    id: "1",
    name: "张先生",
    phone: "13812345678",
    email: "zhang@example.com",
    company: "长春市盛世餐饮有限公司",
    channel: "douyin",
    source: "《代理记账一个月多少钱？》视频",
    status: "new",
    intent: "代理记账",
    assignee: null,
    tags: ["抖音", "记账"],
    notes: [],
    createdAt: "2026-01-16 10:30",
    lastContactAt: null,
  },
  {
    id: "2",
    name: "李女士",
    phone: "13987654321",
    email: null,
    company: null,
    channel: "baidu",
    source: "公司注册 搜索",
    status: "contacted",
    intent: "公司注册",
    assignee: "销售A",
    tags: ["百度", "注册"],
    notes: [{ content: "电话沟通，有意向，约了明天见面", time: "2026-01-16 11:00" }],
    createdAt: "2026-01-16 09:45",
    lastContactAt: "2026-01-16 11:00",
  },
  {
    id: "3",
    name: "王总",
    phone: "13712345678",
    email: "wang@company.com",
    company: "吉林省某科技有限公司",
    channel: "referral",
    source: "老客户张总推荐",
    status: "following",
    intent: "商标注册+代理记账",
    assignee: "销售B",
    tags: ["转介绍", "高意向"],
    notes: [
      { content: "老客户张总推荐，说是朋友", time: "2026-01-15 14:00" },
      { content: "微信沟通，发了报价单", time: "2026-01-15 16:30" },
      { content: "客户在考虑，下周给答复", time: "2026-01-16 10:00" },
    ],
    createdAt: "2026-01-15 13:30",
    lastContactAt: "2026-01-16 10:00",
  },
  {
    id: "4",
    name: "赵经理",
    phone: "13698765432",
    email: null,
    company: "长春某贸易公司",
    channel: "xiaohongshu",
    source: "《创业必看：公司注册流程》",
    status: "new",
    intent: "公司注册咨询",
    assignee: null,
    tags: ["小红书", "注册"],
    notes: [],
    createdAt: "2026-01-16 08:20",
    lastContactAt: null,
  },
  {
    id: "5",
    name: "孙女士",
    phone: "13556789012",
    email: "sun@abc.com",
    company: null,
    channel: "wechat",
    source: "公众号文章咨询",
    status: "contacted",
    intent: "代理记账",
    assignee: "销售A",
    tags: ["微信", "记账"],
    notes: [{ content: "已加微信，发了介绍资料", time: "2026-01-16 12:00" }],
    createdAt: "2026-01-16 11:30",
    lastContactAt: "2026-01-16 12:00",
  },
  {
    id: "6",
    name: "周总",
    phone: "13899998888",
    email: "zhou@bigcorp.com",
    company: "某大型集团",
    channel: "douyin",
    source: "直播间咨询",
    status: "converted",
    intent: "年度代理记账",
    assignee: "销售C",
    tags: ["抖音", "大客户", "已成交"],
    notes: [
      { content: "直播间咨询，当天联系", time: "2026-01-10 20:00" },
      { content: "需求明确，报价5万/年", time: "2026-01-11 10:00" },
      { content: "成交！已签约", time: "2026-01-12 15:00" },
    ],
    createdAt: "2026-01-10 19:30",
    lastContactAt: "2026-01-12 15:00",
  },
  {
    id: "7",
    name: "吴先生",
    phone: "13911112222",
    email: null,
    company: null,
    channel: "baidu",
    source: "代理记账 搜索",
    status: "lost",
    intent: "代理记账",
    assignee: "销售B",
    tags: ["百度", "已流失"],
    notes: [
      { content: "电话打不通", time: "2026-01-14 09:00" },
      { content: "联系上了，说已经找好代账公司了", time: "2026-01-14 14:00" },
    ],
    createdAt: "2026-01-14 08:30",
    lastContactAt: "2026-01-14 14:00",
  },
];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // 过滤线索
  const filteredLeads = mockLeads.filter((lead) => {
    const matchSearch =
      lead.name.includes(searchQuery) ||
      lead.phone.includes(searchQuery) ||
      (lead.company?.includes(searchQuery) ?? false);
    const matchTab = activeTab === "all" || lead.status === activeTab;
    const matchChannel = filterChannel === "all" || lead.channel === filterChannel;
    return matchSearch && matchTab && matchChannel;
  });

  // 统计数据
  const stats = {
    new: mockLeads.filter((l) => l.status === "new").length,
    contacted: mockLeads.filter((l) => l.status === "contacted").length,
    following: mockLeads.filter((l) => l.status === "following").length,
    converted: mockLeads.filter((l) => l.status === "converted").length,
    lost: mockLeads.filter((l) => l.status === "lost").length,
  };

  const getStatusInfo = (statusId: string) => {
    return leadStatuses.find((s) => s.id === statusId) || leadStatuses[0];
  };

  const getChannelInfo = (channelId: string) => {
    return channelOptions.find((c) => c.id === channelId) || channelOptions[5];
  };

  const handleViewDetail = (lead: typeof mockLeads[0]) => {
    setSelectedLead(lead);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">线索中心</h1>
          <p className="text-slate-500 mt-1">管理和跟进所有营销线索</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          手动录入
        </Button>
      </div>

      {/* 状态Tab + 统计 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className="shrink-0"
        >
          全部 ({mockLeads.length})
        </Button>
        {leadStatuses.slice(0, 3).map((status) => (
          <Button
            key={status.id}
            variant={activeTab === status.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(status.id)}
            className="shrink-0"
          >
            {status.name} ({stats[status.id as keyof typeof stats]})
          </Button>
        ))}
      </div>

      {/* 筛选栏 */}
      <Card className="border-slate-200/60">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索姓名、电话、公司..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="来源渠道" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部渠道</SelectItem>
                {channelOptions.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.icon} {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 线索列表 */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <Card className="border-slate-200/60">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">暂无符合条件的线索</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const statusInfo = getStatusInfo(lead.status);
            const channelInfo = getChannelInfo(lead.channel);
            return (
              <Card
                key={lead.id}
                className="border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewDetail(lead)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* 头像 */}
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {lead.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* 主要信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{lead.name}</span>
                        <Badge className={statusInfo.color}>
                          {statusInfo.name}
                        </Badge>
                        {lead.assignee && (
                          <Badge variant="outline" className="text-xs">
                            {lead.assignee}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </span>
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {lead.company}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {channelInfo.icon} {channelInfo.name}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        <span className="text-slate-400">意向：</span>
                        {lead.intent}
                        <span className="text-slate-400 ml-3">来源：</span>
                        {lead.source}
                      </div>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 右侧信息 */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 mb-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {lead.createdAt}
                      </p>
                      {lead.lastContactAt && (
                        <p className="text-xs text-slate-500">
                          最后联系：{lead.lastContactAt}
                        </p>
                      )}
                      {!lead.assignee && lead.status === "new" && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setShowAssignDialog(true);
                          }}
                        >
                          认领
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 线索详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-lg">
                      {selectedLead.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedLead.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusInfo(selectedLead.status).color}>
                        {getStatusInfo(selectedLead.status).name}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {getChannelInfo(selectedLead.channel).icon} {getChannelInfo(selectedLead.channel).name}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* 联系方式 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">电话</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{selectedLead.phone}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <PhoneCall className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">邮箱</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{selectedLead.email || "未提供"}</span>
                    </div>
                  </div>
                </div>

                {/* 公司信息 */}
                {selectedLead.company && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">公司</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{selectedLead.company}</span>
                    </div>
                  </div>
                )}

                {/* 来源信息 */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">来源信息</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p><span className="text-slate-400">渠道：</span>{getChannelInfo(selectedLead.channel).name}</p>
                    <p><span className="text-slate-400">来源：</span>{selectedLead.source}</p>
                    <p><span className="text-slate-400">意向：</span>{selectedLead.intent}</p>
                    <p><span className="text-slate-400">创建时间：</span>{selectedLead.createdAt}</p>
                  </div>
                </div>

                {/* 跟进记录 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-900">跟进记录</h4>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      添加记录
                    </Button>
                  </div>

                  {selectedLead.notes.length > 0 ? (
                    <div className="space-y-3">
                      {selectedLead.notes.map((note, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-px bg-slate-200 ml-2.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-400 mb-1">{note.time}</p>
                            <p className="text-sm text-slate-700">{note.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">暂无跟进记录</p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button className="flex-1">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    拨打电话
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    发送短信
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    预约跟进
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 分配弹窗 */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>认领线索</DialogTitle>
            <DialogDescription>
              确认认领此线索？认领后将由您负责跟进
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedLead.name}</p>
                <p className="text-sm text-slate-500">{selectedLead.phone}</p>
                <p className="text-sm text-slate-500">{selectedLead.intent}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowAssignDialog(false)}>
              确认认领
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
