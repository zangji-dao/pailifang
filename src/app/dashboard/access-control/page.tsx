"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Handshake,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { apiClient, type ApiResponse } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { User } from "../types";

interface Organization {
  id: string;
  name: string;
  code: string;
  type: "platform" | "park" | "enterprise" | "service" | "regulator";
  status: string;
  metadata?: {
    managementCompanyCreditCode?: string;
    managementCompanyLegalPerson?: string;
    managementCompanyAddress?: string;
    managementCompanyPhone?: string;
  };
}

interface AccessRole {
  id: string;
  code: string;
  name: string;
  organizationType: string | null;
  description: string | null;
}

interface OrganizationMember {
  id: string;
  organizationId: string;
  status: string;
  isOwner: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
  };
  roles: Array<{ id: string; code: string; name: string }>;
}

interface ServiceGrant {
  id: string;
  appCode: string;
  permissionCodes: string[];
}

interface Engagement {
  id: string;
  enterpriseOrganizationId: string;
  enterpriseOrganizationName: string;
  providerOrganizationId: string;
  providerOrganizationName: string;
  status: string;
  startsOn: string | null;
  endsOn: string | null;
  grants: ServiceGrant[];
}

interface AccountInvitation {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phone: string | null;
  roleCodes: string[];
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

interface InvitationResult {
  activationPath: string;
  invitation: AccountInvitation;
}

const TYPE_LABELS: Record<Organization["type"], string> = {
  platform: "系统平台（内置）",
  park: "基地运营机构",
  enterprise: "入驻企业",
  service: "服务机构",
  regulator: "监管单位",
};

const APP_LABELS: Record<string, string> = {
  metrics: "经营数据",
  accounting: "账务软件",
  inventory: "进销存",
  hr: "人力资源",
};

function readUser() {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
}

export default function AccessControlPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [section, setSection] = useState<"members" | "delegations" | "organizations">("members");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", email: "", phone: "", password: "", roleCode: "" });
  const [generatedInvitationLink, setGeneratedInvitationLink] = useState("");
  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    code: "",
    type: "park" as Organization["type"],
    creditCode: "",
    legalPerson: "",
    address: "",
    phone: "",
  });
  const [engagementForm, setEngagementForm] = useState({ enterpriseOrganizationId: "", providerOrganizationId: "", appCodes: ["accounting", "metrics"] as string[] });

  const permissions = user?.permissions ?? [];
  const canManagePlatform = permissions.includes("platform.manage");
  const canManageMembers = canManagePlatform || permissions.includes("membership.manage");
  const canManageDelegations = canManagePlatform || permissions.includes("delegation.manage");
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const manageableOrganizationIds = new Set(user?.memberships?.map((membership) => membership.organizationId) ?? []);
  const memberOrganizations = organizations.filter((organization) => canManagePlatform || manageableOrganizationIds.has(organization.id));
  const businessOrganizations = organizations.filter((organization) => organization.type !== "platform");

  const loadOrganizations = useCallback(async () => {
    const response = await apiClient.get<Organization[]>("/api/access-control/organizations");
    if (!response.success || !response.data) {
      toast({ title: "组织信息加载失败", description: response.error, variant: "destructive" });
      return [];
    }
    setOrganizations(response.data);
    return response.data;
  }, [toast]);

  const loadMembers = useCallback(async (organizationId: string, organizationType: string) => {
    const [memberResponse, roleResponse, invitationResponse] = await Promise.all([
      apiClient.get<OrganizationMember[]>(`/api/access-control/members?organizationId=${encodeURIComponent(organizationId)}`),
      apiClient.get<AccessRole[]>(`/api/access-control/roles?organizationType=${encodeURIComponent(organizationType)}`),
      apiClient.get<AccountInvitation[]>(`/api/access-control/invitations?organizationId=${encodeURIComponent(organizationId)}`),
    ]);
    if (memberResponse.success && memberResponse.data) setMembers(memberResponse.data);
    if (roleResponse.success && roleResponse.data) setRoles(roleResponse.data);
    if (invitationResponse.success && invitationResponse.data) setInvitations(invitationResponse.data);
  }, []);

  const loadEngagements = useCallback(async (allowed = true) => {
    if (!allowed) return;
    const response = await apiClient.get<Engagement[]>("/api/access-control/engagements");
    if (response.success && response.data) setEngagements(response.data);
  }, []);

  useEffect(() => {
    const currentUser = readUser();
    const userTimer = window.setTimeout(() => setUser(currentUser), 0);
    void (async () => {
      const rows = await loadOrganizations();
      const preferredId = currentUser?.activeOrganizationId && rows.some((organization) => organization.id === currentUser.activeOrganizationId)
        ? currentUser.activeOrganizationId
        : rows[0]?.id;
      if (preferredId) setSelectedOrganizationId(preferredId);
      setLoading(false);
    })();
    return () => window.clearTimeout(userTimer);
  }, [loadOrganizations]);

  useEffect(() => {
    if (!selectedOrganization) return;
    const timer = window.setTimeout(() => {
      void loadMembers(selectedOrganization.id, selectedOrganization.type);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMembers, selectedOrganization]);

  useEffect(() => {
    if (!canManageDelegations) return;
    const timer = window.setTimeout(() => {
      void loadEngagements(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canManageDelegations, loadEngagements]);

  const openMemberDialog = () => {
    setMemberForm({ name: "", email: "", phone: "", password: "", roleCode: roles[0]?.code ?? "" });
    setGeneratedInvitationLink("");
    setMemberDialogOpen(true);
  };

  const saveMember = async () => {
    if (!selectedOrganizationId || !memberForm.name || !memberForm.email || !memberForm.roleCode) {
      toast({ title: "请完整填写账号和角色", variant: "destructive" });
      return;
    }
    setSaving(true);
    const usesInvitation = selectedOrganization?.type === "enterprise";
    const response: ApiResponse<InvitationResult> = usesInvitation
      ? await apiClient.post<InvitationResult>("/api/access-control/invitations", {
          organizationId: selectedOrganizationId,
          name: memberForm.name,
          email: memberForm.email,
          phone: memberForm.phone,
          roleCodes: [memberForm.roleCode],
        })
      : await apiClient.post<InvitationResult>("/api/access-control/members", {
          organizationId: selectedOrganizationId,
          name: memberForm.name,
          email: memberForm.email,
          phone: memberForm.phone,
          password: memberForm.password,
          roleCodes: [memberForm.roleCode],
        });
    setSaving(false);
    if (!response.success) {
      toast({ title: usesInvitation ? "邀请生成失败" : "账号保存失败", description: response.error, variant: "destructive" });
      return;
    }
    if (usesInvitation && response.data) {
      setGeneratedInvitationLink(`${window.location.origin}${response.data.activationPath}`);
      toast({ title: "激活邀请已生成", description: "复制链接发送给企业成员即可完成开户。" });
    } else {
      setMemberDialogOpen(false);
      toast({ title: "账号与角色已保存" });
    }
    if (selectedOrganization) await loadMembers(selectedOrganization.id, selectedOrganization.type);
  };

  const copyInvitationLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: "激活链接已复制" });
  };

  const regenerateInvitation = async (invitation: AccountInvitation) => {
    const response = await apiClient.post<InvitationResult>(`/api/access-control/invitations/${invitation.id}/regenerate`);
    if (!response.success || !response.data) {
      toast({ title: "邀请重发失败", description: response.error, variant: "destructive" });
      return;
    }
    const link = `${window.location.origin}${response.data.activationPath}`;
    await copyInvitationLink(link);
    if (selectedOrganization) await loadMembers(selectedOrganization.id, selectedOrganization.type);
  };

  const revokeInvitation = async (invitation: AccountInvitation) => {
    const response = await apiClient.post(`/api/access-control/invitations/${invitation.id}/revoke`);
    if (!response.success) {
      toast({ title: "邀请撤销失败", description: response.error, variant: "destructive" });
      return;
    }
    toast({ title: "邀请已撤销" });
    if (selectedOrganization) await loadMembers(selectedOrganization.id, selectedOrganization.type);
  };

  const toggleMember = async (member: OrganizationMember) => {
    const status = member.status === "active" ? "disabled" : "active";
    if (status === "disabled" && !window.confirm(`确认回收 ${member.user.name} 的账号权限吗？该账号在此组织的登录会话会立即失效。`)) return;
    const response = await apiClient.patch(`/api/access-control/members/${member.id}`, { status });
    if (!response.success) {
      toast({ title: "成员状态更新失败", description: response.error, variant: "destructive" });
      return;
    }
    toast({ title: status === "disabled" ? "账号已回收" : "账号已恢复" });
    if (selectedOrganization) await loadMembers(selectedOrganization.id, selectedOrganization.type);
  };

  const saveOrganization = async () => {
    if (!organizationForm.name.trim()) {
      toast({ title: "请填写组织名称", variant: "destructive" });
      return;
    }
    if (organizationForm.type === "park" && organizationForm.creditCode.replace(/[^0-9a-z]/gi, "").length !== 18) {
      toast({ title: "请填写 18 位统一社会信用代码", variant: "destructive" });
      return;
    }
    setSaving(true);
    const response = await apiClient.post<Organization>("/api/access-control/organizations", organizationForm);
    setSaving(false);
    if (!response.success || !response.data) {
      toast({ title: "组织创建失败", description: response.error, variant: "destructive" });
      return;
    }
    setOrganizationDialogOpen(false);
    setOrganizationForm({ name: "", code: "", type: "park", creditCode: "", legalPerson: "", address: "", phone: "" });
    toast({ title: response.data.type === "park" ? "运营机构已创建" : "组织已创建" });
    const rows = await loadOrganizations();
    if (rows.some((organization) => organization.id === response.data?.id)) setSelectedOrganizationId(response.data.id);
  };

  const saveEngagement = async () => {
    if (!engagementForm.enterpriseOrganizationId || !engagementForm.providerOrganizationId || engagementForm.appCodes.length === 0) {
      toast({ title: "请选择委托双方和授权应用", variant: "destructive" });
      return;
    }
    setSaving(true);
    const response = await apiClient.post("/api/access-control/engagements", engagementForm);
    setSaving(false);
    if (!response.success) {
      toast({ title: "委托创建失败", description: response.error, variant: "destructive" });
      return;
    }
    setEngagementDialogOpen(false);
    toast({ title: "服务委托已生效" });
    await loadEngagements(canManageDelegations);
  };

  const enterpriseOrganizations = useMemo(() => organizations.filter((organization) => organization.type === "enterprise"), [organizations]);
  const serviceOrganizations = useMemo(() => organizations.filter((organization) => organization.type === "service"), [organizations]);

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#0f172a,#172554)] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />组织与应用权限</div><h1 className="text-2xl font-semibold">账号与权限</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">账号归属于组织，角色决定操作能力，服务委托决定代账机构能够访问哪些企业和应用。</p></div>
            <Button variant="outline" onClick={() => { void loadOrganizations(); if (selectedOrganization) void loadMembers(selectedOrganization.id, selectedOrganization.type); void loadEngagements(canManageDelegations); }} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><RefreshCw className="mr-2 h-4 w-4" />刷新</Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto p-2">
          <SectionButton active={section === "members"} onClick={() => setSection("members")} icon={Users} label="成员账号" />
          {canManageDelegations && <SectionButton active={section === "delegations"} onClick={() => setSection("delegations")} icon={Handshake} label="服务委托" />}
          {canManagePlatform && <SectionButton active={section === "organizations"} onClick={() => setSection("organizations")} icon={Building2} label="组织管理" />}
        </div>
      </section>

      {section === "members" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}><SelectTrigger className="sm:max-w-sm"><SelectValue placeholder="选择组织" /></SelectTrigger><SelectContent>{memberOrganizations.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organization.name} · {TYPE_LABELS[organization.type]}</SelectItem>)}</SelectContent></Select>
            {canManageMembers && <Button onClick={openMemberDialog} disabled={!selectedOrganization}><Plus className="mr-2 h-4 w-4" />{selectedOrganization?.type === "enterprise" ? "邀请成员" : "新增账号"}</Button>}
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
            {members.map((member) => (
              <article key={member.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 font-semibold text-amber-200">{member.user.name.slice(0, 1)}</div><div className="min-w-0"><h2 className="truncate font-medium text-slate-900">{member.user.name}</h2><p className="truncate text-xs text-slate-400">{member.user.email}</p></div></div><Badge variant="outline" className={member.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>{member.status === "active" ? "启用" : "停用"}</Badge></div>
                <div className="mt-4 flex flex-wrap gap-1.5">{member.roles.map((role) => <span key={role.id} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs text-cyan-700">{role.name}</span>)}{member.isOwner && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">组织所有者</span>}</div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-400">{member.user.phone || "未填写手机号"}</span>{canManageMembers && <Button size="sm" variant="ghost" disabled={member.isOwner && !canManagePlatform} onClick={() => void toggleMember(member)}>{member.status === "active" ? "回收账号" : "恢复账号"}</Button>}</div>
              </article>
            ))}
            {members.length === 0 && <div className="col-span-full flex min-h-64 flex-col items-center justify-center text-center"><UserCog className="h-10 w-10 text-slate-300" /><p className="mt-4 font-medium text-slate-600">该组织还没有成员账号</p></div>}
          </div>
          {selectedOrganization?.type === "enterprise" && (
            <div className="border-t border-slate-100 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h3 className="font-medium text-slate-900">成员激活邀请</h3><p className="mt-1 text-xs text-slate-400">邀请 7 天有效，可随时撤销或重新生成链接。</p></div>
                <Send className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {invitations.map((invitation) => (
                  <article key={invitation.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate font-medium text-slate-900">{invitation.name}</h4><p className="truncate text-xs text-slate-400">{invitation.email}</p></div><Badge variant="outline" className={invitation.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" : invitation.status === "accepted" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>{invitation.status === "pending" ? "待激活" : invitation.status === "accepted" ? "已激活" : invitation.status === "expired" ? "已过期" : "已撤销"}</Badge></div>
                    <p className="mt-3 text-xs text-slate-500">角色：{invitation.roleCodes.map((code) => roles.find((role) => role.code === code)?.name || code).join("、")}</p>
                    {canManageMembers && invitation.status !== "accepted" && <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">{invitation.status === "pending" && <Button size="sm" variant="ghost" onClick={() => void revokeInvitation(invitation)}>撤销</Button>}<Button size="sm" variant="outline" onClick={() => void regenerateInvitation(invitation)}><Link2 className="mr-1.5 h-3.5 w-3.5" />重新生成链接</Button></div>}
                  </article>
                ))}
                {invitations.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">暂无待处理的账号邀请</div>}
              </div>
            </div>
          )}
        </section>
      )}

      {section === "delegations" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-950">企业服务委托</h2><p className="mt-1 text-xs text-slate-400">企业授权服务机构处理指定应用，服务机构账号仍需具备对应角色权限。</p></div><Button onClick={() => setEngagementDialogOpen(true)} disabled={enterpriseOrganizations.length === 0 || serviceOrganizations.length === 0}><Plus className="mr-2 h-4 w-4" />新增委托</Button></div>
          <div className="grid gap-3 p-4 lg:grid-cols-2 sm:p-5">
            {engagements.map((engagement) => <article key={engagement.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-400">委托企业</p><h2 className="mt-1 font-medium text-slate-900">{engagement.enterpriseOrganizationName}</h2></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">已生效</Badge></div><div className="my-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Handshake className="h-5 w-5 text-cyan-600" /><div><p className="text-xs text-slate-400">服务机构</p><p className="font-medium text-slate-800">{engagement.providerOrganizationName}</p></div></div><div className="flex flex-wrap gap-2">{engagement.grants.map((grant) => <span key={grant.id} className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">{APP_LABELS[grant.appCode] || grant.appCode}</span>)}</div></article>)}
            {engagements.length === 0 && <div className="col-span-full flex min-h-64 flex-col items-center justify-center text-center"><Handshake className="h-10 w-10 text-slate-300" /><p className="mt-4 font-medium text-slate-600">尚未建立企业服务委托</p><p className="mt-1 text-sm text-slate-400">先创建服务机构，再由企业授权具体应用。</p></div>}
          </div>
        </section>
      )}

      {section === "organizations" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-950">业务组织目录</h2><p className="mt-1 text-xs text-slate-400">仅展示运营机构、企业、服务机构和监管单位；内置系统平台不属于业务组织。</p></div><Button onClick={() => setOrganizationDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />新增组织</Button></div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">{businessOrganizations.map((organization) => <article key={organization.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate font-medium text-slate-900">{organization.name}</h2><p className="truncate text-xs text-slate-400">{organization.type === "park" ? organization.metadata?.managementCompanyCreditCode || organization.code : organization.code}</p></div></div><div className="mt-4 flex items-center justify-between"><Badge variant="outline">{TYPE_LABELS[organization.type]}</Badge><span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" />正常</span></div></article>)}</div>
        </section>
      )}

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}><DialogContent><DialogHeader><DialogTitle>{selectedOrganization?.type === "enterprise" ? "邀请企业成员" : "新增组织账号"}</DialogTitle><DialogDescription>{selectedOrganization?.type === "enterprise" ? "系统生成一次性激活链接，成员自行设置密码；已有平台账号可直接加入企业。" : "新邮箱必须设置至少 8 位初始密码；已有账号加入新组织时可不填密码。"}</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><FormInput label="姓名" value={memberForm.name} onChange={(name) => setMemberForm((current) => ({ ...current, name }))} /><FormInput label="邮箱" type="email" value={memberForm.email} onChange={(email) => setMemberForm((current) => ({ ...current, email }))} /><FormInput label="手机号" value={memberForm.phone} onChange={(phone) => setMemberForm((current) => ({ ...current, phone }))} />{selectedOrganization?.type !== "enterprise" && <FormInput label="初始密码" type="password" value={memberForm.password} onChange={(password) => setMemberForm((current) => ({ ...current, password }))} />}<div className="space-y-2 sm:col-span-2"><Label>角色</Label><Select value={memberForm.roleCode} onValueChange={(roleCode) => setMemberForm((current) => ({ ...current, roleCode }))}><SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger><SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.code}>{role.name}</SelectItem>)}</SelectContent></Select>{roles.find((role) => role.code === memberForm.roleCode)?.description && <p className="text-xs text-slate-400">{roles.find((role) => role.code === memberForm.roleCode)?.description}</p>}</div>{generatedInvitationLink && <div className="space-y-2 sm:col-span-2"><Label>激活链接</Label><div className="flex gap-2"><Input value={generatedInvitationLink} readOnly className="font-mono text-xs" /><Button type="button" variant="outline" onClick={() => void copyInvitationLink(generatedInvitationLink)}><Copy className="mr-2 h-4 w-4" />复制</Button></div></div>}</div><DialogFooter><Button variant="outline" onClick={() => setMemberDialogOpen(false)}>{generatedInvitationLink ? "完成" : "取消"}</Button>{!generatedInvitationLink && <Button onClick={() => void saveMember()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedOrganization?.type === "enterprise" ? "生成激活链接" : "保存账号"}</Button>}</DialogFooter></DialogContent></Dialog>

      <Dialog open={organizationDialogOpen} onOpenChange={setOrganizationDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增组织</DialogTitle>
            <DialogDescription>运营机构需先建立主档，之后创建基地时直接选择；服务机构和监管单位也在这里维护。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>组织类型</Label><Select value={organizationForm.type} onValueChange={(type: Organization["type"]) => setOrganizationForm((current) => ({ ...current, type }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="park">基地运营机构</SelectItem><SelectItem value="service">服务机构</SelectItem><SelectItem value="regulator">监管单位</SelectItem></SelectContent></Select></div>
            <div className="sm:col-span-2"><FormInput label={organizationForm.type === "park" ? "运营机构名称" : "组织名称"} value={organizationForm.name} onChange={(name) => setOrganizationForm((current) => ({ ...current, name }))} /></div>
            {organizationForm.type === "park" ? (
              <>
                <FormInput label="统一社会信用代码" value={organizationForm.creditCode} onChange={(creditCode) => setOrganizationForm((current) => ({ ...current, creditCode: creditCode.toUpperCase() }))} />
                <FormInput label="法定代表人" value={organizationForm.legalPerson} onChange={(legalPerson) => setOrganizationForm((current) => ({ ...current, legalPerson }))} />
                <FormInput label="联系电话" value={organizationForm.phone} onChange={(phone) => setOrganizationForm((current) => ({ ...current, phone }))} />
                <div className="sm:col-span-2"><FormInput label="注册地址" value={organizationForm.address} onChange={(address) => setOrganizationForm((current) => ({ ...current, address }))} /></div>
              </>
            ) : (
              <div className="sm:col-span-2"><FormInput label="组织编码（可选）" value={organizationForm.code} onChange={(code) => setOrganizationForm((current) => ({ ...current, code }))} /></div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOrganizationDialogOpen(false)}>取消</Button><Button onClick={() => void saveOrganization()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}创建组织</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={engagementDialogOpen} onOpenChange={setEngagementDialogOpen}><DialogContent><DialogHeader><DialogTitle>新增服务委托</DialogTitle><DialogDescription>委托生效后，服务机构成员仅能访问所选企业和授权应用。</DialogDescription></DialogHeader><div className="space-y-4 py-2"><OrganizationSelect label="委托企业" value={engagementForm.enterpriseOrganizationId} organizations={enterpriseOrganizations} onChange={(enterpriseOrganizationId) => setEngagementForm((current) => ({ ...current, enterpriseOrganizationId }))} /><OrganizationSelect label="服务机构" value={engagementForm.providerOrganizationId} organizations={serviceOrganizations} onChange={(providerOrganizationId) => setEngagementForm((current) => ({ ...current, providerOrganizationId }))} /><div className="space-y-2"><Label>授权应用</Label><div className="grid grid-cols-2 gap-2">{Object.entries(APP_LABELS).map(([appCode, label]) => { const active = engagementForm.appCodes.includes(appCode); return <button key={appCode} type="button" onClick={() => setEngagementForm((current) => ({ ...current, appCodes: active ? current.appCodes.filter((code) => code !== appCode) : [...current.appCodes, appCode] }))} className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors", active ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{active ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4 text-slate-400" />}{label}</button>; })}</div></div></div><DialogFooter><Button variant="outline" onClick={() => setEngagementDialogOpen(false)}>取消</Button><Button onClick={() => void saveEngagement()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}确认授权</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function SectionButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Users; label: string }) {
  return <button type="button" onClick={onClick} className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors", active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")}><Icon className="h-4 w-4" />{label}</button>;
}

function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function OrganizationSelect({ label, value, organizations, onChange }: { label: string; value: string; organizations: Organization[]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder={`选择${label}`} /></SelectTrigger><SelectContent>{organizations.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>)}</SelectContent></Select></div>;
}
