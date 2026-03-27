"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  X,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// 类型定义
type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";
type ApplicationType = "new" | "migration";

interface Attachment {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

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
  registeredCapital: string | null;
  businessScope: string | null;
  businessTerm: string | null;
  createdAt: string;
  status: string;
  attachments?: Attachment[];
}

// 状态配置
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-slate-50 text-slate-600 border-slate-200" },
  pending: { label: "待审批", className: "bg-amber-50 text-amber-600 border-amber-200" },
  approved: { label: "已通过", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-600 border-red-200" },
};

const applicationTypeConfig: Record<ApplicationType, { label: string; className: string }> = {
  new: { label: "新建企业", className: "bg-purple-50 text-purple-600 border-purple-200" },
  migration: { label: "迁移企业", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function ApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // 默认不选中，显示引导页

  // 审批相关状态
  const [actionLoading, setActionLoading] = useState(false);

  // 驳回弹窗
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);

  // 审批确认弹窗
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvingApp, setApprovingApp] = useState<Application | null>(null);
  const [checkingAttachments, setCheckingAttachments] = useState(false);
  const [approveAttachments, setApproveAttachments] = useState<Attachment[]>([]);

  // 上传附件弹窗
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingApp, setUploadingApp] = useState<Application | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

  // 下载状态
  const [downloadingApp, setDownloadingApp] = useState<string | null>(null);
  const [exportingApp, setExportingApp] = useState<string | null>(null);
  const [printingApp, setPrintingApp] = useState<string | null>(null);

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

  // 导出申请（生成并下载 PDF）
  const handleExport = async (app: Application) => {
    setExportingApp(app.id);
    try {
      const response = await fetch(`/api/applications/${app.id}`);
      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.error || "获取申请详情失败");
        return;
      }

      // 动态导入 PDF 导出函数
      const { exportApplicationToPdf } = await import("@/lib/pdf-export");
      await exportApplicationToPdf(result.data);
      toast.success("PDF 文件已下载");
    } catch (err) {
      console.error("导出 PDF 失败:", err);
      toast.error("导出 PDF 失败");
    } finally {
      setExportingApp(null);
    }
  };

  // 打印申请
  const handlePrint = async (app: Application) => {
    setPrintingApp(app.id);
    try {
      const response = await fetch(`/api/applications/${app.id}`);
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
            @page { size: A4; margin: 15mm; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: SimSun, 宋体, serif; font-size: 14px; line-height: 1.8; color: rgb(0,0,0); background: rgb(255,255,255); padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .header .subtitle { font-size: 14px; color: rgb(102,102,102); }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; }
            .info-row { display: flex; margin-bottom: 5px; }
            .info-label { width: 140px; flex-shrink: 0; font-weight: bold; }
            .info-value { flex: 1; border-bottom: 1px solid rgb(0,0,0); min-height: 20px; padding-left: 5px; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            table th, table td { border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; }
            table th { background: rgb(245,245,245); font-weight: bold; }
            .signature-area { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { width: 220px; text-align: center; }
            .signature-line { border-bottom: 1px solid rgb(0,0,0); height: 80px; margin-bottom: 10px; }
            .signature-label { font-weight: bold; margin-bottom: 15px; }
            .footer { margin-top: 40px; font-size: 12px; color: rgb(102,102,102); display: flex; justify-content: space-between; }
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
                <div class="info-row"><span class="info-label">申请编号：</span><span class="info-value">${data.applicationNo}</span></div>
                <div class="info-row"><span class="info-label">申请日期：</span><span class="info-value">${data.applicationDate ? new Date(data.applicationDate).toLocaleDateString("zh-CN") : "-"}</span></div>
                <div class="info-row"><span class="info-label">企业名称：</span><span class="info-value">${data.enterpriseName}</span></div>
                <div class="info-row"><span class="info-label">申请类型：</span><span class="info-value">${applicationTypeMap[data.applicationType] || "-"}</span></div>
                <div class="info-row"><span class="info-label">注册资本：</span><span class="info-value">${data.registeredCapital ? `${data.registeredCapital} 万元` : "-"}</span></div>
                <div class="info-row"><span class="info-label">纳税人类型：</span><span class="info-value">${taxTypeMap[data.taxType] || "-"}</span></div>
              </div>
              ${enterpriseNameBackups.length > 0 ? `<div class="info-row" style="margin-top: 10px;"><span class="info-label">备选名称：</span><span class="info-value">${enterpriseNameBackups.join("、")}</span></div>` : ""}
            </div>
            <div class="section">
              <div class="section-title">二、地址信息</div>
              <div class="info-row"><span class="info-label">原注册地址：</span><span class="info-value">${data.originalRegisteredAddress || "-"}</span></div>
              <div class="info-row"><span class="info-label">通讯地址：</span><span class="info-value">${data.mailingAddress || "-"}</span></div>
              <div class="info-row"><span class="info-label">经营地址：</span><span class="info-value">${data.businessAddress || "-"}</span></div>
            </div>
            <div class="section">
              <div class="section-title">三、人员信息</div>
              ${personnel.length > 0 ? `
              <table>
                <thead><tr><th style="width: 100px;">姓名</th><th style="width: 120px;">职务</th><th style="width: 130px;">手机号</th><th>邮箱</th></tr></thead>
                <tbody>
                  ${personnel.map((p: any) => `<tr><td>${p.name || "-"}</td><td>${(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}</td><td>${p.phone || "-"}</td><td>${p.email || "-"}</td></tr>`).join("")}
                </tbody>
              </table>
              ` : '<p style="color: rgb(153,153,153);">暂无人员信息</p>'}
            </div>
            <div class="section">
              <div class="section-title">四、股东信息</div>
              ${shareholders.length > 0 ? `
              <table>
                <thead><tr><th style="width: 80px;">类型</th><th style="width: 120px;">姓名/名称</th><th style="width: 100px;">投资额(万元)</th><th style="width: 130px;">手机号</th><th>备注</th></tr></thead>
                <tbody>
                  ${shareholders.map((s: any) => `<tr><td>${shareholderTypeMap[s.type] || "-"}</td><td>${s.name || "-"}</td><td>${s.investment || "-"}</td><td>${s.phone || "-"}</td><td>${s.type === "enterprise" ? "企业股东" : ""}</td></tr>`).join("")}
                </tbody>
              </table>
              ` : '<p style="color: rgb(153,153,153);">暂无股东信息</p>'}
            </div>
            <div class="section">
              <div class="section-title">五、经营信息</div>
              <div class="info-grid">
                <div class="info-row"><span class="info-label">预计年营收：</span><span class="info-value">${data.expectedAnnualRevenue ? `${data.expectedAnnualRevenue} 万元` : "-"}</span></div>
                <div class="info-row"><span class="info-label">预计年纳税：</span><span class="info-value">${data.expectedAnnualTax ? `${data.expectedAnnualTax} 万元` : "-"}</span></div>
              </div>
              ${data.businessScope ? `<div class="info-row" style="margin-top: 10px;"><span class="info-label">经营范围：</span><span class="info-value">${data.businessScope}</span></div>` : ""}
            </div>
            <div class="section">
              <div class="section-title">六、其他信息</div>
              <div class="info-grid">
                <div class="info-row"><span class="info-label">园区联系人：</span><span class="info-value">${data.ewtContactName || "-"}</span></div>
                <div class="info-row"><span class="info-label">园区联系电话：</span><span class="info-value">${data.ewtContactPhone || "-"}</span></div>
                <div class="info-row"><span class="info-label">中介机构：</span><span class="info-value">${data.intermediaryDepartment || "-"}</span></div>
                <div class="info-row"><span class="info-label">中介联系人：</span><span class="info-value">${[data.intermediaryName, data.intermediaryPhone].filter(Boolean).join(" / ") || "-"}</span></div>
              </div>
              ${data.remarks ? `<div class="info-row" style="margin-top: 10px;"><span class="info-label">备注：</span><span class="info-value">${data.remarks}</span></div>` : ""}
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

        setTimeout(() => {
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (printIframe.parentNode) {
              document.body.removeChild(printIframe);
            }
          }, 1000);
        }, 500);
      }
    } catch (error) {
      console.error("打印失败:", error);
      toast.error("打印失败");
    } finally {
      setPrintingApp(null);
    }
  };

  // 删除审批弹窗中的附件
  const handleDeleteApproveAttachment = async (attachmentName: string) => {
    if (!approvingApp) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${approvingApp.id}/attachments?name=${encodeURIComponent(attachmentName)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("删除成功");
        setApproveAttachments((prev) => prev.filter((a) => a.name !== attachmentName));
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除失败:", err);
      toast.error("删除失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 获取申请列表
  const fetchApplications = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch("/api/applications/list", { signal });
      if (!response.ok) {
        throw new Error("获取申请列表失败");
      }
      const result = await response.json();
      setApplications(result.data || []);
      setError(null);
    } catch (err) {
      // 忽略 AbortError
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("获取申请列表失败:", err);
      setError(err instanceof Error ? err.message : "获取申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, []);

  // 从 URL 参数恢复筛选状态（从详情页返回时）
  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ["pending", "rejected", "approved"].includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  // 过滤申请列表（只显示非草稿）
  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === null || app.approvalStatus === statusFilter;
    const matchKeyword =
      !searchKeyword ||
      app.enterpriseName.includes(searchKeyword) ||
      app.applicationNo.includes(searchKeyword) ||
      (app.legalPersonName && app.legalPersonName.includes(searchKeyword));
    return matchStatus && matchKeyword && app.approvalStatus !== "draft";
  });

  // 统计数据（不含草稿）
  const stats = {
    total: applications.filter((a) => a.approvalStatus !== "draft").length,
    pending: applications.filter((a) => a.approvalStatus === "pending").length,
    approved: applications.filter((a) => a.approvalStatus === "approved").length,
    rejected: applications.filter((a) => a.approvalStatus === "rejected").length,
  };

  // 查看申请详情（跳转到入驻申请详情页）
  const handleViewDetail = (app: Application) => {
    router.push(`/dashboard/base/applications/${app.id}?from=approval&status=${statusFilter}`);
  };

  // 打开审批确认弹窗
  const handleOpenApprove = async (app: Application) => {
    setApprovingApp(app);
    setApproveAttachments([]);
    setApproveDialogOpen(true);

    // 加载附件信息
    setCheckingAttachments(true);
    try {
      const response = await fetch(`/api/applications/${app.id}/attachments`);
      const result = await response.json();
      if (result.success) {
        setApproveAttachments(result.data || []);
      }
    } catch (err) {
      console.error("加载附件失败:", err);
    } finally {
      setCheckingAttachments(false);
    }
  };

  // 确认审批通过
  const handleConfirmApprove = async () => {
    if (!approvingApp) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${approvingApp.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("审批通过");
        setApproveDialogOpen(false);
        setApprovingApp(null);
        fetchApplications();
      } else {
        toast.error(result.error || "审批失败");
      }
    } catch (err) {
      console.error("审批失败:", err);
      toast.error("审批失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 打开驳回弹窗
  const handleOpenReject = (app: Application) => {
    setRejectingApp(app);
    setRejectDialogOpen(true);
  };

  // 驳回申请
  const handleReject = async () => {
    if (!rejectingApp || !rejectReason.trim()) {
      toast.error("请填写驳回原因");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${rejectingApp.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("已驳回申请");
        setRejectDialogOpen(false);
        setRejectReason("");
        setRejectingApp(null);
        fetchApplications();
      } else {
        toast.error(result.error || "驳回失败");
      }
    } catch (err) {
      console.error("驳回失败:", err);
      toast.error("驳回失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 打开上传附件弹窗
  const handleOpenUpload = async (app: Application) => {
    setUploadingApp(app);
    setSelectedFiles([]);
    setExistingAttachments([]);
    setUploadDialogOpen(true);

    // 加载已有附件
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/applications/${app.id}/attachments`);
      const result = await response.json();
      if (result.success) {
        setExistingAttachments(result.data || []);
      }
    } catch (err) {
      console.error("加载附件失败:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 过滤只允许图片
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      toast.warning("只支持图片格式文件");
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    // 清空 input 以便再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 移除文件
  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 上传附件
  const handleUpload = async () => {
    if (!uploadingApp || selectedFiles.length === 0) {
      toast.error("请选择要上传的文件");
      return;
    }

    try {
      setUploadingFiles(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/applications/${uploadingApp.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`成功上传 ${result.data.length} 个附件`);
        setSelectedFiles([]);
        // 更新已有附件列表
        setExistingAttachments((prev) => [...prev, ...result.data]);
        fetchApplications();
      } else {
        toast.error(result.error || "上传失败");
      }
    } catch (err) {
      console.error("上传失败:", err);
      toast.error("上传失败");
    } finally {
      setUploadingFiles(false);
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentName: string) => {
    if (!uploadingApp) return;

    try {
      setDeletingAttachment(attachmentName);
      const response = await fetch(`/api/applications/${uploadingApp.id}/attachments?name=${encodeURIComponent(attachmentName)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("删除成功");
        setExistingAttachments((prev) => prev.filter((a) => a.name !== attachmentName));
        fetchApplications();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (err) {
      console.error("删除失败:", err);
      toast.error("删除失败");
    } finally {
      setDeletingAttachment(null);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => fetchApplications()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 页面标题 */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          入驻审批
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          审批企业入驻申请
        </p>
      </div>

      {/* 分割线 */}
      <div className="border-b" />

      {/* 统计卡片区域 */}
      <div className="py-6">
        <div className="flex items-center gap-4">
          {/* 状态统计 */}
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-3">审批状态</div>
            <div className="grid grid-cols-3 gap-3">
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
          <div className="text-muted-foreground mb-2">点击上方状态卡片查看对应申请</div>
          <div className="text-sm text-muted-foreground">待审批申请将显示在列表中供您审批</div>
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
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请编号</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">企业名称</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请类型</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">法人/电话</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">状态</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">附件</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">申请时间</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {statusFilter === "pending" ? "暂无待审批申请" : "暂无申请记录"}
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
                        <Badge variant="outline" className={cn("font-normal", statusConfig[app.approvalStatus].className)}>
                          {statusConfig[app.approvalStatus].label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-sm",
                          app.attachments && app.attachments.length > 0 ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {app.attachments?.length || 0}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(app)}
                            className="gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(app)}
                            disabled={exportingApp === app.id}
                            className="gap-1"
                          >
                            {exportingApp === app.id ? (
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
                            下载材料
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(app)}
                            disabled={printingApp === app.id}
                            className="gap-1"
                          >
                            {printingApp === app.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Printer className="h-3.5 w-3.5" />
                            )}
                            打印
                          </Button>
                          {statusFilter === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenReject(app)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                驳回
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleOpenApprove(app)}
                                disabled={actionLoading}
                                className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                通过
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

      {/* 驳回弹窗 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>
              请填写驳回原因，申请人将看到此信息并可以修改后重新提交。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
                setRejectingApp(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批确认弹窗 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>审批通过</DialogTitle>
            <DialogDescription>
              请上传盖章后的签字表扫描件，然后确认通过。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 申请信息 */}
            {approvingApp && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">申请编号</span>
                  <span className="font-mono">{approvingApp.applicationNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">企业名称</span>
                  <span>{approvingApp.enterpriseName || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">法人代表</span>
                  <span>{approvingApp.legalPersonName || "-"}</span>
                </div>
              </div>
            )}

            {/* 上传附件 */}
            <div>
              <h4 className="text-sm font-medium mb-2">上传签字表扫描件</h4>
              {checkingAttachments ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 已上传的附件 */}
                  {approveAttachments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {approveAttachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-[1.4/1] rounded-lg border overflow-hidden bg-muted">
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteApproveAttachment(att.name)}
                            disabled={actionLoading}
                            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 上传按钮 */}
                  <label className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {approveAttachments.length > 0 ? "继续上传" : "点击上传"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0 || !approvingApp) return;
                        
                        setActionLoading(true);
                        try {
                          const formData = new FormData();
                          files.forEach((file) => formData.append("files", file));
                          
                          const response = await fetch(`/api/applications/${approvingApp.id}/attachments`, {
                            method: "POST",
                            body: formData,
                          });
                          const result = await response.json();
                          
                          if (result.success) {
                            setApproveAttachments((prev) => [...prev, ...result.data]);
                            toast.success("上传成功");
                          } else {
                            toast.error(result.error || "上传失败");
                          }
                        } catch (err) {
                          toast.error("上传失败");
                        } finally {
                          setActionLoading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setApprovingApp(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={actionLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传附件弹窗 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>附件管理</DialogTitle>
            <DialogDescription>
              管理签字表扫描件，支持多张图片上传。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 已上传附件列表 */}
            <div>
              <h4 className="text-sm font-medium mb-2">已上传附件</h4>
              {loadingAttachments ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  加载中...
                </div>
              ) : existingAttachments.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {existingAttachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(attachment.url, "_blank")}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(attachment.name)}
                          disabled={deletingAttachment === attachment.name}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          {deletingAttachment === attachment.name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  暂无附件
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="border-t" />

            {/* 选择文件按钮 */}
            <div>
              <h4 className="text-sm font-medium mb-2">添加新附件</h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-16 border-dashed"
              >
                <Plus className="h-5 w-5 mr-2" />
                选择图片文件
              </Button>
            </div>

            {/* 待上传文件列表 */}
            {selectedFiles.length > 0 && (
              <div className="border rounded-lg divide-y">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const url = URL.createObjectURL(file);
                          window.open(url, "_blank");
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePreview(index)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 提示信息 */}
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG 格式图片，建议上传清晰完整的扫描件。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFiles([]);
                setUploadingApp(null);
                setExistingAttachments([]);
              }}
            >
              关闭
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploadingFiles}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {uploadingFiles && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                上传 ({selectedFiles.length} 个文件)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
