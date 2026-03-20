"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, User, Crown, Calculator, Phone } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 测试账号快捷登录
  const testAccounts = [
    { email: "admin@example.com", password: "admin123", name: "管理员", role: "admin", icon: Crown, color: "text-amber-600", bg: "hover:bg-amber-50 hover:border-amber-300" },
    { email: "accountant@example.com", password: "accountant123", name: "会计", role: "accountant", icon: Calculator, color: "text-emerald-600", bg: "hover:bg-emerald-50 hover:border-emerald-300" },
    { email: "sales@example.com", password: "sales123", name: "销售", role: "sales", icon: Phone, color: "text-blue-600", bg: "hover:bg-blue-50 hover:border-blue-300" },
  ];

  const handleQuickLogin = async (account: typeof testAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/api/auth/login", {
        email: account.email,
        password: account.password,
      });

      if (!response.success) {
        throw new Error(response.error || "登录失败");
      }

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.error || "登录失败");
      }

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl font-bold text-white">Π</span>
            </div>
          </div>
          {/* 标题 */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">Π立方企业服务中心</h1>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                邮箱
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
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
              className="w-full h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/20"
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>

          {/* 测试账号快捷登录 */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">测试账号快捷登录</p>
            <div className="grid grid-cols-3 gap-2">
              {testAccounts.map((account) => (
                <Button
                  key={account.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`h-9 text-xs border-slate-200 ${account.bg}`}
                  onClick={() => handleQuickLogin(account)}
                  disabled={loading}
                >
                  <account.icon className={`w-3.5 h-3.5 mr-1 ${account.color}`} />
                  {account.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
