"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Link2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  TestTube,
} from "lucide-react";

// 渠道类型配置
const channelTypes = [
  // 短视频平台
  { id: "douyin", name: "抖音", icon: "🎬", color: "bg-pink-500", category: "短视频" },
  { id: "kuaishou", name: "快手", icon: "🎥", color: "bg-orange-500", category: "短视频" },
  { id: "video_account", name: "视频号", icon: "📺", color: "bg-purple-500", category: "短视频" },
  { id: "bilibili", name: "B站", icon: "📺", color: "bg-cyan-500", category: "短视频" },
  // 社交媒体
  { id: "wechat", name: "微信", icon: "📱", color: "bg-green-500", category: "社交" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", color: "bg-red-500", category: "社交" },
  { id: "zhihu", name: "知乎", icon: "💡", color: "bg-blue-600", category: "社交" },
  // 搜索广告
  { id: "baidu", name: "百度SEM", icon: "🔍", color: "bg-blue-500", category: "搜索" },
  { id: "toutiao", name: "今日头条", icon: "📰", color: "bg-red-600", category: "搜索" },
  { id: "sogou", name: "搜狗", icon: "🔎", color: "bg-orange-600", category: "搜索" },
  // 信息流广告
  { id: "tencent_ads", name: "腾讯广告", icon: "💬", color: "bg-green-600", category: "广告" },
  { id: "uc", name: "UC头条", icon: "📱", color: "bg-orange-500", category: "广告" },
  // 本地生活
  { id: "dianping", name: "大众点评", icon: "⭐", color: "bg-yellow-500", category: "本地" },
  { id: "meituan", name: "美团", icon: "🏪", color: "bg-yellow-600", category: "本地" },
  { id: "58tongcheng", name: "58同城", icon: "📞", color: "bg-amber-600", category: "本地" },
  // 企业服务
  { id: "qichacha", name: "企查查", icon: "🏢", color: "bg-blue-700", category: "企业" },
  { id: "tianyancha", name: "天眼查", icon: "👁️", color: "bg-indigo-600", category: "企业" },
  // 口碑与线下
  { id: "referral", name: "口碑转介绍", icon: "🤝", color: "bg-amber-500", category: "口碑" },
  { id: "offline", name: "线下渠道", icon: "🏛️", color: "bg-slate-500", category: "线下" },
  { id: "other", name: "其他", icon: "📌", color: "bg-gray-500", category: "其他" },
];

// 接入方式
const accessMethods = [
  { id: "api", name: "API接入" },
  { id: "webhook", name: "Webhook回调" },
  { id: "manual", name: "手动录入" },
  { id: "excel", name: "Excel导入" },
];

// 模拟渠道数据
const mockChannels = [
  {
    id: "1",
    name: "抖音-记账服务推广",
    type: "douyin",
    status: "active",
    owner: "销售A",
    accessMethod: "api",
    todayLeads: 12,
    monthLeads: 286,
    conversionRate: 8.2,
    cost: 12000,
    lastSync: "5分钟前",
  },
  {
    id: "2",
    name: "抖音-工商注册",
    type: "douyin",
    status: "active",
    owner: "销售B",
    accessMethod: "api",
    todayLeads: 8,
    monthLeads: 152,
    conversionRate: 12.1,
    cost: 8500,
    lastSync: "3分钟前",
  },
  {
    id: "3",
    name: "微信公众号",
    type: "wechat",
    status: "active",
    owner: "销售A",
    accessMethod: "api",
    todayLeads: 5,
    monthLeads: 98,
    conversionRate: 5.6,
    cost: 3200,
    lastSync: "10分钟前",
  },
  {
    id: "4",
    name: "视频号-企业服务",
    type: "video_account",
    status: "active",
    owner: "销售C",
    accessMethod: "webhook",
    todayLeads: 3,
    monthLeads: 45,
    conversionRate: 6.7,
    cost: 2100,
    lastSync: "1小时前",
  },
  {
    id: "5",
    name: "小红书-商标注册",
    type: "xiaohongshu",
    status: "active",
    owner: "销售B",
    accessMethod: "manual",
    todayLeads: 2,
    monthLeads: 32,
    conversionRate: 9.4,
    cost: 4100,
    lastSync: "手动录入",
  },
  {
    id: "6",
    name: "百度SEM-公司注册",
    type: "baidu",
    status: "active",
    owner: "销售A",
    accessMethod: "api",
    todayLeads: 6,
    monthLeads: 120,
    conversionRate: 15.2,
    cost: 9800,
    lastSync: "2分钟前",
  },
  {
    id: "7",
    name: "口碑转介绍",
    type: "referral",
    status: "active",
    owner: "全员",
    accessMethod: "manual",
    todayLeads: 4,
    monthLeads: 68,
    conversionRate: 28.5,
    cost: 0,
    lastSync: "手动录入",
  },
  {
    id: "8",
    name: "地推活动-高新区",
    type: "offline",
    status: "inactive",
    owner: "销售D",
    accessMethod: "excel",
    todayLeads: 0,
    monthLeads: 15,
    conversionRate: 0,
    cost: 500,
    lastSync: "已停用",
  },
];

export default function ChannelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<typeof mockChannels[0] | null>(null);

  // 新建/编辑渠道表单状态
  const [formData, setFormData] = useState({
    name: "",
    type: "douyin",
    owner: "",
    accessMethod: "api",
    apiKey: "",
    autoAssign: true,
    autoTag: true,
    autoWelcome: false,
    welcomeMessage: "",
    notifySms: false,
    notifyWechat: true,
    notifyEmail: false,
  });

  // 过滤渠道列表
  const filteredChannels = mockChannels.filter((channel) => {
    const matchSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || channel.type === filterType;
    const matchStatus = filterStatus === "all" || channel.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 统计数据
  const stats = {
    totalChannels: mockChannels.filter((c) => c.status === "active").length,
    todayLeads: mockChannels.reduce((sum, c) => sum + c.todayLeads, 0),
    monthLeads: mockChannels.reduce((sum, c) => sum + c.monthLeads, 0),
    avgConversion: (
      mockChannels.reduce((sum, c) => sum + c.conversionRate, 0) / mockChannels.length
    ).toFixed(1),
    totalCost: mockChannels.reduce((sum, c) => sum + c.cost, 0),
  };

  const getChannelTypeInfo = (typeId: string) => {
    return channelTypes.find((t) => t.id === typeId) || channelTypes[7];
  };

  const handleSaveChannel = () => {
    // 保存逻辑
    console.log("Saving channel:", formData);
    setShowAddDialog(false);
    setEditingChannel(null);
    // 重置表单
    setFormData({
      name: "",
      type: "douyin",
      owner: "",
      accessMethod: "api",
      apiKey: "",
      autoAssign: true,
      autoTag: true,
      autoWelcome: false,
      welcomeMessage: "",
      notifySms: false,
      notifyWechat: true,
      notifyEmail: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">渠道管理</h1>
          <p className="text-slate-500 mt-1">配置和管理各推广渠道，追踪营销效果</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加渠道
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">活跃渠道</p>
                <p className="text-lg font-semibold">{stats.totalChannels}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">今日线索</p>
                <p className="text-lg font-semibold">{stats.todayLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">本月线索</p>
                <p className="text-lg font-semibold">{stats.monthLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">平均转化</p>
                <p className="text-lg font-semibold">{stats.avgConversion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">本月投入</p>
                <p className="text-lg font-semibold">¥{stats.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="border-slate-200/60">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索渠道名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="渠道类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {channelTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已启用</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 渠道列表 */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">渠道名称</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">类型</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">负责人</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">今日/本月</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">转化率</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">投入</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">同步状态</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredChannels.map((channel) => {
                  const typeInfo = getChannelTypeInfo(channel.type);
                  return (
                    <tr key={channel.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeInfo.icon}</span>
                          <span className="font-medium text-slate-900">{channel.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal">
                          {typeInfo.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {channel.status === "active" ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            启用中
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            已停用
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{channel.owner}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">{channel.todayLeads}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-600">{channel.monthLeads}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-green-600">{channel.conversionRate}%</span>
                          {channel.conversionRate > 10 && (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {channel.cost > 0 ? `¥${channel.cost.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <RefreshCw className="h-3 w-3" />
                          {channel.lastSync}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <BarChart3 className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingChannel(channel);
                              setShowAddDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 添加/编辑渠道弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "编辑渠道" : "添加渠道"}</DialogTitle>
            <DialogDescription>
              配置推广渠道的接入方式和自动化规则
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基础信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900">基础信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">渠道名称</label>
                  <Input
                    placeholder="如：抖音-记账服务推广"
                    value={editingChannel ? editingChannel.name : formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">渠道类型</label>
                  <Select 
                    value={editingChannel ? editingChannel.type : formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">负责人</label>
                  <Select 
                    value={formData.owner} 
                    onValueChange={(v) => setFormData({ ...formData, owner: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择负责人" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_a">销售A</SelectItem>
                      <SelectItem value="sales_b">销售B</SelectItem>
                      <SelectItem value="sales_c">销售C</SelectItem>
                      <SelectItem value="all">全员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">接入方式</label>
                  <Select 
                    value={formData.accessMethod} 
                    onValueChange={(v) => setFormData({ ...formData, accessMethod: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accessMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* API配置 */}
            {(formData.accessMethod === "api" || formData.accessMethod === "webhook") && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-900">接入配置</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="API密钥 / Webhook地址"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formData.accessMethod === "api" 
                      ? "输入平台提供的API密钥，点击测试按钮验证连接" 
                      : "配置Webhook回调地址，平台将在有新线索时推送数据"}
                  </p>
                </div>
              </div>
            )}

            {/* 自动规则 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900">自动化规则</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">自动分配</p>
                    <p className="text-xs text-slate-500">新线索自动分配给负责人</p>
                  </div>
                  <Switch checked={formData.autoAssign} onCheckedChange={(v) => setFormData({ ...formData, autoAssign: v })} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">自动打标签</p>
                    <p className="text-xs text-slate-500">根据渠道自动添加来源标签</p>
                  </div>
                  <Switch checked={formData.autoTag} onCheckedChange={(v) => setFormData({ ...formData, autoTag: v })} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">自动欢迎语</p>
                    <p className="text-xs text-slate-500">新线索自动发送欢迎消息</p>
                  </div>
                  <Switch checked={formData.autoWelcome} onCheckedChange={(v) => setFormData({ ...formData, autoWelcome: v })} />
                </div>
                {formData.autoWelcome && (
                  <Input
                    placeholder="您好，感谢您的咨询，我们将尽快与您联系..."
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* 通知设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900">通知设置</h4>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300" checked={formData.notifySms} onChange={(e) => setFormData({ ...formData, notifySms: e.target.checked })} />
                  <span className="text-sm text-slate-600">短信通知</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300" checked={formData.notifyWechat} onChange={(e) => setFormData({ ...formData, notifyWechat: e.target.checked })} />
                  <span className="text-sm text-slate-600">微信通知</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300" checked={formData.notifyEmail} onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })} />
                  <span className="text-sm text-slate-600">邮件通知</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveChannel}>
              {editingChannel ? "保存修改" : "添加渠道"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
