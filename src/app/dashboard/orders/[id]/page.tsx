"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Calendar,
  MessageCircle,
  Paperclip,
  FileText,
  CircleDot,
  Scale,
  Palette,
  Award,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Send,
  Upload,
  ChevronRight,
  AlertCircle,
  Wallet,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// 工单详情数据
const orderDetail = {
  id: "WO-2026-006",
  type: "business",
  typeName: "工商注册",
  title: "分公司注册",
  customer: {
    name: "吉林省宏远贸易公司",
    contact: "王经理",
    phone: "138-0000-0001",
    email: "wang@hongyuan.com",
    address: "长春市朝阳区人民大街888号",
  },
  amount: 2500,
  deadline: "2026-01-19",
  priority: "high",
  status: "in_progress",
  progress: 60,
  currentStep: "等待工商局审核",
  description: "为吉林省宏远贸易公司注册长春分公司，需要办理营业执照、公章刻制、税务登记等全套服务。分公司地址：长春市朝阳区人民大街888号。",
  salesPerson: {
    name: "张销售",
    phone: "138-0000-0002",
    share: 750,
    sharePercent: 30,
  },
  handler: {
    name: "李会计",
    phone: "138-0000-0003",
    share: 1250,
    sharePercent: 50,
  },
  createdAt: "2026-01-13 14:20",
};

// 进度节点
const progressSteps = [
  { id: 1, name: "核名申请", status: "completed", completedAt: "01-13 15:30", note: "名称核准通过：吉林省宏远贸易公司长春分公司" },
  { id: 2, name: "提交材料", status: "completed", completedAt: "01-14 10:00", note: "已提交全部注册材料" },
  { id: 3, name: "工商审核", status: "in_progress", startedAt: "01-14 10:00", note: "预计3-5个工作日" },
  { id: 4, name: "领取执照", status: "pending", note: "待审核通过后领取" },
  { id: 5, name: "刻制公章", status: "pending", note: "公章、财务章、法人章" },
  { id: 6, name: "税务登记", status: "pending", note: "办理税务报到" },
  { id: 7, name: "银行开户", status: "pending", note: "开立基本账户" },
  { id: 8, name: "交付完成", status: "pending", note: "移交全部材料" },
];

// 沟通记录
const communications = [
  {
    id: 1,
    user: "李会计",
    role: "处理人",
    content: "材料已提交工商局，预计3-5个工作日审核完成。",
    time: "01-14 10:00",
    type: "progress",
  },
  {
    id: 2,
    user: "张销售",
    role: "销售",
    content: "好的，我这边同步客户进度，有问题及时沟通。",
    time: "01-14 10:15",
    type: "message",
  },
  {
    id: 3,
    user: "李会计",
    role: "处理人",
    content: "收到核名通过通知，下午准备材料提交注册。",
    time: "01-13 15:30",
    type: "progress",
    attachments: ["核名通知书.pdf"],
  },
  {
    id: 4,
    user: "张销售",
    role: "销售",
    content: "客户已确认分公司名称，请尽快核名。",
    time: "01-13 14:30",
    type: "message",
  },
];

// 附件
const attachments = [
  { name: "公司章程.pdf", size: "1.2MB", uploadedAt: "01-13", uploadedBy: "李会计" },
  { name: "股东会决议.pdf", size: "856KB", uploadedAt: "01-13", uploadedBy: "李会计" },
  { name: "核名通知书.pdf", size: "234KB", uploadedAt: "01-13", uploadedBy: "李会计" },
];

// 获取优先级样式
const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "high":
      return { label: "紧急", className: "bg-rose-50 text-rose-600 border-rose-200" };
    case "medium":
      return { label: "普通", className: "bg-amber-50 text-amber-600 border-amber-200" };
    case "low":
      return { label: "低优", className: "bg-slate-50 text-slate-600 border-slate-200" };
    default:
      return { label: "普通", className: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  switch (type) {
    case "business": return Briefcase;
    case "trademark": return CircleDot;
    case "patent": return FileText;
    case "legal": return Scale;
    case "design": return Palette;
    case "qualification": return Award;
    default: return FileText;
  }
};

export default function OrderDetailPage() {
  const [newMessage, setNewMessage] = useState("");
  const priorityStyle = getPriorityStyle(orderDetail.priority);
  const TypeIcon = getTypeIcon(orderDetail.type);

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link 
        href="/dashboard/orders/mine" 
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回我的工单
      </Link>

      {/* 头部信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
            <TypeIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-amber-600">{orderDetail.id}</span>
              <Badge variant="outline" className={`text-xs ${priorityStyle.className}`}>
                {priorityStyle.label}
              </Badge>
              <span className="text-sm text-slate-400">{orderDetail.typeName}</span>
              <Badge className="text-xs bg-amber-100 text-amber-700 border border-amber-200">
                进行中
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{orderDetail.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{orderDetail.customer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            联系销售
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 border-0">
            <CheckCircle2 className="h-4 w-4" />
            提交完成
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：进度 + 沟通 */}
        <div className="col-span-2 space-y-6">
          {/* 进度跟踪 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  进度跟踪
                </CardTitle>
                <span className="text-sm text-slate-500">
                  截止日期：{orderDetail.deadline}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Progress value={orderDetail.progress} className="h-2 flex-1 bg-slate-100" />
                <span className="text-sm font-medium text-amber-600">{orderDetail.progress}%</span>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                当前阶段：<span className="font-medium text-slate-900">{orderDetail.currentStep}</span>
              </p>
              
              {/* 进度节点 */}
              <div className="space-y-0">
                {progressSteps.map((step, index) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.status === "completed" 
                          ? "bg-emerald-500 text-white" 
                          : step.status === "in_progress"
                            ? "bg-amber-500 text-white ring-4 ring-amber-100"
                            : "bg-slate-200 text-slate-400"
                      }`}>
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-[10px] font-medium">{step.id}</span>
                        )}
                      </div>
                      {index < progressSteps.length - 1 && (
                        <div className={`w-0.5 h-8 ${
                          step.status === "completed" ? "bg-emerald-500" : "bg-slate-200"
                        }`} />
                      )}
                    </div>
                    <div className={`flex-1 pb-4 ${step.status === "pending" ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          step.status === "in_progress" ? "text-amber-600" : "text-slate-900"
                        }`}>
                          {step.name}
                        </p>
                        {step.completedAt && (
                          <span className="text-xs text-slate-400">{step.completedAt}</span>
                        )}
                        {step.startedAt && (
                          <span className="text-xs text-amber-500">进行中</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 沟通记录 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-amber-500" />
                沟通记录
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs font-medium ${
                        comm.role === "处理人" 
                          ? "bg-amber-100 text-amber-600" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {comm.user.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">{comm.user}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {comm.role}
                        </span>
                        <span className="text-xs text-slate-400">{comm.time}</span>
                      </div>
                      <p className="text-sm text-slate-600">{comm.content}</p>
                      {comm.attachments && (
                        <div className="flex gap-2 mt-2">
                          {comm.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-xs text-slate-600">
                              <Paperclip className="h-3 w-3" />
                              {att}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 发送消息 */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
                <Button className="h-9 w-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：详情信息 */}
        <div className="space-y-4">
          {/* 金额信息 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500 mb-1">工单金额</p>
                <p className="text-2xl font-semibold text-slate-900">¥{orderDetail.amount.toLocaleString()}</p>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">销售（{orderDetail.salesPerson.sharePercent}%）</span>
                  </div>
                  <span className="font-medium text-slate-900">¥{orderDetail.salesPerson.share}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-400" />
                    <span className="text-slate-600">执行人（{orderDetail.handler.sharePercent}%）</span>
                  </div>
                  <span className="font-medium text-amber-600">¥{orderDetail.handler.share}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">平台（20%）</span>
                  </div>
                  <span className="font-medium text-slate-900">¥{(orderDetail.amount * 0.2).toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 客户信息 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                客户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">{orderDetail.customer.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">{orderDetail.customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">{orderDetail.customer.email}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">{orderDetail.customer.address}</span>
              </div>
            </CardContent>
          </Card>

          {/* 相关人员 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                相关人员
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">张</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{orderDetail.salesPerson.name}</p>
                    <p className="text-[10px] text-slate-500">销售</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-100 text-amber-600 text-xs">李</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{orderDetail.handler.name}</p>
                    <p className="text-[10px] text-amber-500">处理人（我）</p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">
                  执行中
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 附件 */}
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-amber-500" />
                附件
                <span className="text-xs text-slate-400 font-normal">({attachments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{file.size} · {file.uploadedBy}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2 h-8 text-xs">
                <Upload className="h-3.5 w-3.5" />
                上传附件
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
