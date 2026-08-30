"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, User, Crown } from "lucide-react";
import { BrandMark } from "@/components/brand-logo";

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="w-full max-w-sm border-slate-200/60 shadow-xl relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 pt-8 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <BrandMark className="h-16 w-16 drop-shadow-[0_12px_24px_rgba(15,23,42,0.18)]" />
          </div>
          {/* 标题 */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">Π立方企业服务中心</h1>
            <p className="mt-1 text-xs tracking-wide text-slate-400">园区经营服务中台</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 pb-8">
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                邮箱
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-10 border-slate-200 focus:border-amber-400 focus:ring-amber-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-10 border-slate-200 focus:border-amber-400 focus:ring-amber-100"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full bg-slate-950 font-medium text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>

          {showLocalAdminLogin && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-3">仅限本机开发环境</p>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-slate-300 text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                onClick={handleLocalAdminLogin}
                disabled={loading}
              >
                <Crown className="w-4 h-4 mr-2" />
                管理员一键登录
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
