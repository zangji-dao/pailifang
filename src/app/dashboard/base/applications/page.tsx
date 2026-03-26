"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Send,
  Edit,
  Trash2,
  GitBranch,
  Loader2,
  AlertCircle,
  Share2,
  MessageSquareWarning,
  ArrowLeft,
  Download,
  Printer,
  DoorOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTabs } from "@/app/dashboard/tabs-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { ShareDialog } from "./_components/ShareDialog";
import { exportApplicationToPdf, type ApplicationData } from "@/lib/pdf-export";

// 检测是否在微信内
const isWechat = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("micromessenger");
};

// 检测是否支持 Web Share API
const canWebShare = (): boolean => {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
};

// 类型定义
type ApprovalStatus = "filling" | "pending" | "approved" | "rejected";
type ApplicationType = "new" | "migration";

interface Application {
  id: string;
  applicationNo: string;
  applicationDate: string | null;
  enterpriseName: string;
  enterpriseNameBackups: string[] | null;
  applicationType: ApplicationType;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  assignedAddress: string | null;
  legalPersonName: string | null;
  legalPersonPhone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  status: string;
  createdAt: string;
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  filling: { label: "填报中", className: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  pending: { label: "待审批", className: "bg-blue-50 text-blue-600 border-blue-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const applicationTypeConfig: Record<ApplicationType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsContext = useTabs();
  const confirm = useConfirm();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // 默认不选中，显示引导页

  // 分享相关状态
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [sharingAppId, setSharingAppId] = useState<string | null>(null);

  // 驳回原因弹窗状态
  const [rejectReasonDialogOpen, setRejectReasonDialogOpen] = useState(false);
  const [selectedRejectApp, setSelectedRejectApp] = useState<Application | null>(null);

  // 下载状态
  const [downloadingApp, setDownloadingApp] = useState<string | null>(null);

  // 下载附件
  const handleDownloadAttachments = async (app: Application) => {
    try {
      setDownloadingApp(app.id);
      const response = await fetch(`/api/applications/${app.id}/download-attachments`);
      
      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || "下载失败");
        return;
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = `${app.enterpriseName || "企业申请"}_${app.applicationNo}_附件.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      // 下载文件
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("下载成功");
    } catch (err) {
      console.error("下载失败:", err);
      toast.error("下载失败");
    } finally {
      setDownloadingApp(null);
    }
  };

  // 查看驳回原因
  const handleViewRejectReason = (app: Application) => {
    setSelectedRejectApp(app);
    setRejectReasonDialogOpen(true);
  };

  // 获取申请列表
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settlement/applications");
      if (!response.ok) {
        throw new Error("获取申请列表失败");
      }
      const result = await response.json();
      setApplications(result.data || []);
      setError(null);
    } catch (err) {
      console.error("获取申请列表失败:", err);
      setError(err instanceof Error ? err.message : "获取申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 从 URL 参数恢复筛选状态（从编辑页返回时）
  useEffect(() => {
    const from = searchParams.get("from");
    if (from && ["filling", "pending", "rejected", "approved"].includes(from)) {
      setStatusFilter(from);
    }
  }, [searchParams]);

  // 打开新建表单（新标签页）
  const handleCreate = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: "new-application",
        label: "新建入驻申请",
        path: "/dashboard/base/applications/new",
        icon: <Plus className="h-3.5 w-3.5" />,
      });
    } else {
      router.push("/dashboard/base/applications/new");
    }
  };

  // 打开编辑表单（带上当前筛选状态）
  const handleEdit = (application: Application) => {
    const fromStatus = statusFilter || "";
    router.push(`/dashboard/base/applications/${application.id}?from=${fromStatus}`);
  };

  // 提交审批
  const handleSubmit = async (id: string) => {
    const confirmed = await confirm({
      title: "提交审批",
      description: "确认提交此申请进行审批？",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}/submit`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        toast.success("申请已提交审批");
      } else {
        toast.error(result.error || "提交失败");
      }
    } catch (err) {
      console.error("提交审批失败:", err);
      toast.error("提交审批失败");
    }
  };

  // 删除申请
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "删除申请",
      description: "确认删除此申请？删除后无法恢复。",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settlement/applications/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchApplications();
        toast.success("申请已删除");
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除申请失败:", err);
      toast.error("删除申请失败");
    }
  };

  // 查看流程
  const handleViewProcess = (application: Application) => {
    router.push(`/dashboard/base/processes?applicationId=${application.id}`);
  };

  // 导出申请（生成并下载 PDF）
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  
  const handleExport = async (application: Application) => {
    setExportingId(application.id);
    try {
      // 获取申请详情
      const response = await fetch(`/api/applications/${application.id}`);
      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.error || "获取申请详情失败");
        return;
      }
      
      // 生成并下载 PDF
      await exportApplicationToPdf(result.data as ApplicationData);
      toast.success("PDF 文件已下载");
    } catch (err) {
      console.error("导出 PDF 失败:", err);
      toast.error("导出 PDF 失败");
    } finally {
      setExportingId(null);
    }
  };

  // 打印申请（使用隐藏 iframe 直接打印，不打开新窗口）
  const handlePrint = async (application: Application) => {
    setPrintingId(application.id);
    try {
      // 获取申请详情
      const response = await fetch(`/api/applications/${application.id}`);
      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.error || "获取申请详情失败");
        return;
      }
      
      const data = result.data;
    const personnel = Array.isArray(data.personnel) ? data.personnel : [];
    const shareholders = Array.isArray(data.shareholders) ? data.shareholders : [];
    const enterpriseNameBackups = data.enterpriseNameBackups || [];

    // 职务映射
    const roleMap: Record<string, string> = {
      legal_person: "法人代表",
      supervisor: "监事",
      finance_manager: "财务负责人",
      ewt_contact: "e窗通登录联系人",
    };

    // 股东类型映射
    const shareholderTypeMap: Record<string, string> = {
      natural: "自然人",
      enterprise: "企业",
    };

    // 申请类型映射
    const applicationTypeMap: Record<string, string> = {
      new: "新建企业",
      migration: "迁移企业",
    };

    // 纳税人类型映射
    const taxTypeMap: Record<string, string> = {
      general: "一般纳税人",
      small_scale: "小规模纳税人",
    };

    // 生成打印内容
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>入驻申请表 - ${data.enterpriseName}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: SimSun, 宋体, serif;
            font-size: 14px;
            line-height: 1.8;
            color: rgb(0,0,0);
            background: rgb(255,255,255);
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .header .subtitle {
            font-size: 14px;
            color: rgb(102,102,102);
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            border-bottom: 2px solid rgb(0,0,0);
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          .info-label {
            width: 140px;
            flex-shrink: 0;
            font-weight: bold;
          }
          .info-value {
            flex: 1;
            border-bottom: 1px solid rgb(0,0,0);
            min-height: 20px;
            padding-left: 5px;
            padding-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          table th, table td {
            border: 1px solid rgb(0,0,0);
            padding: 8px 10px;
            text-align: left;
          }
          table th {
            background: rgb(245,245,245);
            font-weight: bold;
          }
          .signature-area {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 220px;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid rgb(0,0,0);
            height: 80px;
            margin-bottom: 10px;
          }
          .signature-label {
            font-weight: bold;
            margin-bottom: 15px;
          }
          .footer {
            margin-top: 40px;
            text-align: right;
            font-size: 12px;
            color: rgb(102,102,102);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>企业入驻申请表</h1>
            <div class="subtitle">Π立方企业服务中心</div>
          </div>

          <div class="section">
            <div class="section-title">一、基本信息</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">申请编号：</span>
                <span class="info-value">${data.applicationNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">申请日期：</span>
                <span class="info-value">${data.applicationDate ? new Date(data.applicationDate).toLocaleDateString("zh-CN") : "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">企业名称：</span>
                <span class="info-value">${data.enterpriseName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">申请类型：</span>
                <span class="info-value">${applicationTypeMap[data.applicationType] || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">注册资本：</span>
                <span class="info-value">${data.registeredCapital || "-"} ${data.currencyType || "万元"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">纳税人类型：</span>
                <span class="info-value">${taxTypeMap[data.taxType] || "-"}</span>
              </div>
            </div>
            ${enterpriseNameBackups.length > 0 ? `
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">备选名称：</span>
              <span class="info-value">${enterpriseNameBackups.join("、")}</span>
            </div>
            ` : ""}
          </div>

          <div class="section">
            <div class="section-title">二、地址信息</div>
            <div class="info-row">
              <span class="info-label">原注册地址：</span>
              <span class="info-value">${data.originalRegisteredAddress || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">通讯地址：</span>
              <span class="info-value">${data.mailingAddress || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">经营地址：</span>
              <span class="info-value">${data.businessAddress || "-"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">三、人员信息</div>
            ${personnel.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 100px;">姓名</th>
                  <th style="width: 120px;">职务</th>
                  <th style="width: 130px;">手机号</th>
                  <th>邮箱</th>
                </tr>
              </thead>
              <tbody>
                ${personnel.map((p: any) => `
                  <tr>
                    <td>${p.name || "-"}</td>
                    <td>${(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}</td>
                    <td>${p.phone || "-"}</td>
                    <td>${p.email || "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ` : '<p style="color: rgb(153,153,153);">暂无人员信息</p>'}
          </div>

          <div class="section">
            <div class="section-title">四、股东信息</div>
            ${shareholders.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 80px;">类型</th>
                  <th style="width: 120px;">姓名/名称</th>
                  <th style="width: 100px;">投资额(万元)</th>
                  <th style="width: 130px;">手机号</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                ${shareholders.map((s: any) => `
                  <tr>
                    <td>${shareholderTypeMap[s.type] || "-"}</td>
                    <td>${s.name || "-"}</td>
                    <td>${s.investment || "-"}</td>
                    <td>${s.phone || "-"}</td>
                    <td>${s.type === "enterprise" ? "企业股东" : ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ` : '<p style="color: rgb(153,153,153);">暂无股东信息</p>'}
          </div>

          <div class="section">
            <div class="section-title">五、经营信息</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">预计年营收：</span>
                <span class="info-value">${data.expectedAnnualRevenue ? `${data.expectedAnnualRevenue} 万元` : "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">预计年纳税：</span>
                <span class="info-value">${data.expectedAnnualTax ? `${data.expectedAnnualTax} 万元` : "-"}</span>
              </div>
            </div>
            ${data.businessScope ? `
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">经营范围：</span>
              <span class="info-value">${data.businessScope}</span>
            </div>
            ` : ""}
          </div>

          <div class="section">
            <div class="section-title">六、其他信息</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">园区联系人：</span>
                <span class="info-value">${data.ewtContactName || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">园区联系电话：</span>
                <span class="info-value">${data.ewtContactPhone || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">中介机构：</span>
                <span class="info-value">${data.intermediaryDepartment || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">中介联系人：</span>
                <span class="info-value">${[data.intermediaryName, data.intermediaryPhone].filter(Boolean).join(" / ") || "-"}</span>
              </div>
            </div>
            ${data.remarks ? `
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">备注：</span>
              <span class="info-value">${data.remarks}</span>
            </div>
            ` : ""}
          </div>

          <div class="signature-area">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">申请人签字（盖章）</div>
              <div style="font-size: 12px; color: rgb(102,102,102);">日期：____年____月____日</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">审核人签字</div>
              <div style="font-size: 12px; color: rgb(102,102,102);">日期：____年____月____日</div>
            </div>
          </div>

          <div class="footer">
            <div>申请编号：${data.applicationNo}</div>
            <div>打印时间：${new Date().toLocaleString("zh-CN")}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 创建隐藏的 iframe 用于打印
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.left = "-9999px";
    printIframe.style.top = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "none";
    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // 等待内容加载后打印
      printIframe.onload = () => {
        printIframe.contentWindow?.print();
        // 打印后移除 iframe
        setTimeout(() => {
          if (printIframe.parentNode) {
            document.body.removeChild(printIframe);
          }
        }, 1000);
      };

      // 如果 onload 不触发，手动触发打印
      setTimeout(() => {
        if (printIframe.parentNode) {
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (printIframe.parentNode) {
              document.body.removeChild(printIframe);
            }
          }, 1000);
        }
      }, 500);
    }
    } catch (error) {
      console.error("打印失败:", error);
      toast.error("打印失败");
    } finally {
      setPrintingId(null);
    }
  };

  // 新建企业（跳转到企业管理的创建页面）
  const handleAssignRoom = (application: Application) => {
    // 跳转到企业管理的创建页面，传递申请ID作为参数
    router.push(`/dashboard/base/tenants/create?applicationId=${application.id}`);
  };

  // 转发分享
  const handleShare = async (application: Application) => {
    setCreatingShare(true);
    setSharingAppId(application.id);
    try {
      const response = await fetch("/api/applications/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const result = await response.json();

      if (result.success) {
        setShareUrl(result.data.shareUrl);
        setShareDialogOpen(true);
      } else {
        toast.error(result.error || "创建分享链接失败");
      }
    } catch (err) {
      console.error("创建分享链接失败:", err);
      toast.error("创建分享链接失败");
    } finally {
      setCreatingShare(false);
      setSharingAppId(null);
    }
  };

  // 复制分享链接
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("链接已复制到剪贴板");
  };

  // 过滤申请列表
  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === null || app.approvalStatus === statusFilter;
    const matchKeyword =
      !searchKeyword ||
      app.enterpriseName.includes(searchKeyword) ||
      app.applicationNo.includes(searchKeyword) ||
      (app.legalPersonName && app.legalPersonName.includes(searchKeyword));
    return matchStatus && matchKeyword;
  });

  // 统计数据
  const stats = {
    total: applications.length,
    filling: applications.filter((a) => a.approvalStatus === "filling").length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 页面标题 */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          入驻申请
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          填写入园审批表，管理企业入驻申请
        </p>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 统计卡片区域 */}
      <div className="py-6">
        <div className="flex gap-4">
          {/* 新建申请按钮 */}
          <button
            onClick={handleCreate}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-rose-400 px-6 py-4 transition-all hover:bg-rose-50 min-w-[140px]"
          >
            <Plus className="h-8 w-8 text-rose-500 mb-2" />
            <span className="text-sm font-medium text-rose-600">新建申请</span>
          </button>

          {/* 状态统计 */}
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-3">申请状态</div>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => setStatusFilter(statusFilter === "filling" ? null : "filling")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "filling" 
                    ? "border-cyan-500 bg-cyan-50" 
                    : "border-border hover:border-cyan-300 hover:bg-cyan-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">填报中</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "filling" ? "text-cyan-600" : "text-foreground")}>{stats.filling}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "pending" 
                    ? "border-amber-500 bg-amber-50" 
                    : "border-border hover:border-amber-300 hover:bg-amber-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">待审批</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "pending" ? "text-amber-600" : "text-foreground")}>{stats.pending}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "rejected" ? null : "rejected")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "rejected" 
                    ? "border-red-500 bg-red-50" 
                    : "border-border hover:border-red-300 hover:bg-red-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">已驳回</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "rejected" ? "text-red-600" : "text-foreground")}>{stats.rejected}</div>
                </div>
                <XCircle className="w-4 h-4 text-red-400" />
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "approved" ? null : "approved")}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all",
                  statusFilter === "approved" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-border hover:border-emerald-300 hover:bg-emerald-50/50"
                )}
              >
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">已通过</div>
                  <div className={cn("text-xl font-semibold", statusFilter === "approved" ? "text-emerald-600" : "text-foreground")}>{stats.approved}</div>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 空状态引导页 - 默认显示 */}
      {statusFilter === null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-2">点击上方「新建申请」创建入驻申请</div>
          <div className="text-sm text-muted-foreground">或点击状态卡片查看已有申请</div>
        </div>
      )}

      {/* 列表区域 - 点击卡片后显示 */}
      {statusFilter !== null && (
        <div className="py-6">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(null)}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              <span className="text-sm font-medium text-foreground">
                {statusFilter === "filling" && "填报中申请"}
                {statusFilter === "pending" && "待审批申请"}
                {statusFilter === "rejected" && "已驳回申请"}
                {statusFilter === "approved" && "已通过申请"}
              </span>
              <span className="text-sm text-muted-foreground">({filteredApplications.length})</span>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索企业名称、编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* 申请列表 */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive mb-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请编号</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请类型</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">创建时间</th>
              <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  暂无申请记录，点击"填写申请表"开始
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/50">
                  <td className="p-4 text-sm font-mono">{app.applicationNo}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{app.enterpriseName}</div>
                    {app.enterpriseNameBackups && app.enterpriseNameBackups.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        备用名: {app.enterpriseNameBackups.join("、")}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={cn("font-normal", applicationTypeConfig[app.applicationType].className)}>
                      {applicationTypeConfig[app.applicationType].label}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">
                    <div>{app.legalPersonName || "-"}</div>
                    <div className="text-muted-foreground">{app.legalPersonPhone || "-"}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("font-normal", statusConfig[app.approvalStatus].className)}>
                        {statusConfig[app.approvalStatus].label}
                      </Badge>
                      {app.approvalStatus === "rejected" && app.rejectionReason && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRejectReason(app)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                        >
                          <MessageSquareWarning className="h-3 w-3" />
                          查看原因
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {app.approvalStatus === "filling" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(app)}
                            className="gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            继续申请
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(app)}
                            disabled={creatingShare && sharingAppId === app.id}
                            className="gap-1 text-amber-600 hover:text-amber-700"
                          >
                            {creatingShare && sharingAppId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            转发
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                            提交
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(app.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {app.approvalStatus === "rejected" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(app)}
                            className="gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            修改
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(app)}
                            disabled={creatingShare && sharingAppId === app.id}
                            className="gap-1 text-amber-600 hover:text-amber-700"
                          >
                            {creatingShare && sharingAppId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            转发
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(app.id)}
                            className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                            重新提交
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(app.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {app.approvalStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(app)}
                            className="gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(app)}
                            disabled={exportingId === app.id}
                            className="gap-1"
                          >
                            {exportingId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            导出
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachments(app)}
                            disabled={downloadingApp === app.id}
                            className="gap-1"
                          >
                            {downloadingApp === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            下载附件
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(app)}
                            disabled={printingId === app.id}
                            className="gap-1"
                          >
                            {printingId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Printer className="h-3.5 w-3.5" />
                            )}
                            打印
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(app.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {app.approvalStatus === "approved" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(app)}
                            disabled={exportingId === app.id}
                            className="gap-1"
                          >
                            {exportingId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            导出
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachments(app)}
                            disabled={downloadingApp === app.id}
                            className="gap-1"
                          >
                            {downloadingApp === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            下载附件
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(app)}
                            disabled={printingId === app.id}
                            className="gap-1"
                          >
                            {printingId === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Printer className="h-3.5 w-3.5" />
                            )}
                            打印
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAssignRoom(app)}
                            className="gap-1"
                          >
                            <DoorOpen className="h-3.5 w-3.5" />
                            新建企业
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </div>
      )}

      {/* 分享弹窗 */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        onCopy={copyShareUrl}
      />

      {/* 驳回原因弹窗 */}
      <Dialog open={rejectReasonDialogOpen} onOpenChange={setRejectReasonDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <MessageSquareWarning className="h-5 w-5" />
              驳回原因
            </DialogTitle>
            <DialogDescription>
              申请编号：{selectedRejectApp?.applicationNo}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 leading-relaxed whitespace-pre-wrap">
                {selectedRejectApp?.rejectionReason}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setRejectReasonDialogOpen(false)}
            >
              我知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
