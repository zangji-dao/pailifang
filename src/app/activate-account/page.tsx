"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, type ApiResponse } from "@/lib/apiClient";
import type { User } from "@/app/dashboard/types";

interface InvitationDetails {
  organizationName: string;
  organizationType: string;
  email: string;
  name: string;
  roles: Array<{ code: string; name: string }>;
  expiresAt: string;
  existingAccount: boolean;
}

type ActivationResponse = ApiResponse<User> & { token?: string };

export default function ActivateAccountPage() {
  const router = useRouter();
  const tokenRef = useRef("");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const invitationToken = new URLSearchParams(window.location.search).get("token") || "";
    tokenRef.current = invitationToken;
    if (!invitationToken) {
      const timer = window.setTimeout(() => {
        setError("激活链接缺少必要参数");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    void apiClient.get<InvitationDetails>(`/api/auth/invitations/${encodeURIComponent(invitationToken)}`).then((response) => {
      if (!response.success || !response.data) {
        setError(response.error || "激活链接无效");
      } else {
        setInvitation(response.data);
      }
      setLoading(false);
    });
  }, []);

  const activate = async () => {
    const token = tokenRef.current;
    if (!invitation || !token) return;
    if (!invitation.existingAccount) {
      if (password.length < 8) {
        setError("登录密码至少需要 8 位");
        return;
      }
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    const response = await apiClient.post<User>(
      `/api/auth/invitations/${encodeURIComponent(token)}/accept`,
      { password: invitation.existingAccount ? undefined : password },
    ) as ActivationResponse;
    setSubmitting(false);
    if (!response.success || !response.data || !response.token) {
      setError(response.error || "账号激活失败");
      return;
    }

    localStorage.setItem("user", JSON.stringify(response.data));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", response.token);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe_0,#f8fafc_42%,#e2e8f0_100%)] p-4">
      <Card className="w-full max-w-lg border-white/70 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <CardHeader className="items-center space-y-4 pb-3 pt-8 text-center">
          <BrandMark className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">激活企业账号</h1>
            <p className="mt-1 text-sm text-slate-500">设置登录方式并加入企业组织</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          {loading && <div className="flex min-h-44 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>}

          {!loading && error && !invitation && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">{error}</div>
          )}

          {invitation && (
            <>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs text-cyan-700">受邀加入</p>
                    <h2 className="font-semibold text-cyan-950">{invitation.organizationName}</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" />{invitation.email}</div>
                  <div className="flex items-center gap-2 text-slate-600"><ShieldCheck className="h-4 w-4 text-slate-400" />{invitation.roles.map((role) => role.name).join("、")}</div>
                </div>
              </div>

              {invitation.existingAccount ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" />该邮箱已有平台账号</div>
                  <p className="mt-1 text-emerald-700">确认后直接加入企业组织，不会修改原登录密码。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">设置登录密码</Label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="至少 8 位" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认登录密码</Label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="pl-9" placeholder="再次输入密码" /></div>
                  </div>
                </div>
              )}

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <Button className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800" onClick={() => void activate()} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invitation.existingAccount ? "确认加入并登录" : "激活账号并登录"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
