"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  Crown,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { BrandMark } from "@/components/brand-logo";
import { SiteComplianceFooter } from "@/components/site-compliance-footer";

interface LoginUser {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showLocalAdminLogin = process.env.NODE_ENV === "development";

  const completeLogin = (user: LoginUser, token: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", token);
    router.push("/dashboard");
  };

  const handleLocalAdminLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/local-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.data || !data.token) {
        throw new Error(data.error || "管理员一键登录失败");
      }

      completeLogin(data.data as LoginUser, data.token as string);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "管理员一键登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("请输入邮箱和密码");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("请输入正确的邮箱地址");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.data || !data.token) {
        throw new Error(data.error || "登录失败");
      }

      completeLogin(data.data as LoginUser, data.token as string);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#07111f] lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(430px,0.82fr)]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden px-10 py-10 text-white lg:flex xl:px-16 xl:py-12">
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[32rem] w-[32rem] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.075] [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-[980px] flex-col justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11 shadow-[0_16px_40px_rgba(0,0,0,0.3)]" />
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-white">Π立方企业服务中心</p>
              <p className="mt-0.5 text-[10px] tracking-[0.28em] text-slate-400">ENTERPRISE SERVICE PLATFORM</p>
            </div>
          </div>

          <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                政企服务数字化平台
              </div>
              <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.12] tracking-[-0.04em] xl:text-6xl">
                让园区经营数据
                <span className="mt-2 block bg-gradient-to-r from-amber-200 via-amber-100 to-cyan-200 bg-clip-text text-transparent">
                  成为看得见的增长
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 xl:text-lg">
                连接基地、企业、财税与服务机构，以统一的数据视角呈现经营成果，让管理决策更及时、更清晰。
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  { icon: Building2, title: "基地运营", description: "空间与入驻全流程" },
                  { icon: ChartNoAxesCombined, title: "经营洞察", description: "税收与营收数据" },
                  { icon: ShieldCheck, title: "分级权限", description: "多组织安全协作" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <item.icon className="h-5 w-5 text-amber-200" />
                    <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[430px]">
              <div className="absolute inset-[8%] rounded-full border border-white/10" />
              <div className="absolute inset-[20%] rounded-full border border-dashed border-amber-200/25" />
              <div className="absolute inset-[30%] rotate-45 rounded-[2.5rem] border border-cyan-200/20 bg-white/[0.035] shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-md" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrandMark className="h-36 w-36 drop-shadow-[0_28px_70px_rgba(0,0,0,0.5)] xl:h-40 xl:w-40" />
              </div>
              <div className="absolute left-[4%] top-[19%] rounded-2xl border border-white/10 bg-[#101c2d]/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Operating Data</p>
                <p className="mt-1 text-sm font-semibold text-white">基地企业经营数据</p>
              </div>
              <div className="absolute bottom-[12%] right-0 rounded-2xl border border-amber-200/15 bg-amber-100/[0.08] px-4 py-3 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-amber-100/50">Collaboration</p>
                <p className="mt-1 text-sm font-semibold text-amber-50">企业服务一体协同</p>
              </div>
              <div className="absolute right-[9%] top-[9%] h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_28px_8px_rgba(165,243,252,0.24)]" />
              <div className="absolute bottom-[20%] left-[10%] h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_28px_8px_rgba(253,230,138,0.22)]" />
            </div>
          </div>

          <p className="text-xs tracking-[0.12em] text-slate-500">DATA-DRIVEN · SERVICE-ORIENTED · SECURE-BY-DESIGN</p>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f5f1e8] px-4 sm:px-8 lg:px-10 xl:px-14">
        <div className="absolute -right-28 top-[-5rem] h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 pt-6 lg:hidden">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold text-slate-950">Π立方企业服务中心</p>
            <p className="text-[10px] tracking-[0.2em] text-slate-400">园区经营服务中台</p>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-1 items-center py-8 sm:py-12">
          <div className="w-full rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_32px_90px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Secure Access</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">欢迎回来</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-amber-200 shadow-lg shadow-slate-950/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">登录后进入基地经营、企业服务与账务协同工作台。</p>

            <form onSubmit={handleLogin} noValidate className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">邮箱账号</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus:border-amber-400 focus:ring-amber-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">登录密码</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus:border-amber-400 focus:ring-amber-100"
                  />
                </div>
              </div>

              {error && (
                <div aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="group h-12 w-full rounded-xl bg-slate-950 font-medium text-white shadow-xl shadow-slate-950/15 hover:bg-slate-800"
                disabled={loading}
              >
                {loading ? "登录中..." : "进入工作台"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            {showLocalAdminLogin && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-center text-xs text-slate-400">仅限本机开发环境</p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-slate-300 text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                  onClick={handleLocalAdminLogin}
                  disabled={loading}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  管理员一键登录
                </Button>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              数据加密传输 · 权限分级管控 · 业务全程留痕
            </div>
          </div>
        </div>

        <SiteComplianceFooter className="relative z-10 pb-5 sm:pb-7" />
      </section>
    </div>
  );
}
