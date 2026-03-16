"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "登录失败");
      }

      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: string) => {
    const testUsers = {
      admin: { id: "admin-001", email: "admin@test.com", name: "管理员", role: "admin" },
      accountant: { id: "accountant-001", email: "accountant@test.com", name: "张会计", role: "accountant" },
      sales: { id: "sales-001", email: "sales@test.com", name: "李销售", role: "sales" },
    };

    localStorage.setItem("user", JSON.stringify(testUsers[role as keyof typeof testUsers]));
    localStorage.setItem("isLoggedIn", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between items-center text-white relative overflow-hidden">
        {/* 背景装饰图案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">Π立方企业服务中心</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            专业企业服务<br/>
            一站式管理平台
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            高效管理客户、账套、工单和分润<br/>
            让企业服务更简单高效
          </p>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-1">100+</div>
              <div className="text-blue-100">服务客户</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-blue-100">管理账套</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-1">2000+</div>
              <div className="text-blue-100">完成工单</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-1">99%</div>
              <div className="text-blue-100">客户满意度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Π立方企业服务中心</span>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                欢迎回来
              </CardTitle>
              <CardDescription className="text-base">
                登录您的账号以继续使用
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    邮箱地址
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>

              {/* 快速登录 */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600 text-center mb-4">
                  快速体验（演示模式）
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                    onClick={() => handleQuickLogin("admin")}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="text-xs">管理员</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all"
                    onClick={() => handleQuickLogin("accountant")}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs">会计</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all"
                    onClick={() => handleQuickLogin("sales")}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-purple-500" />
                      <span className="text-xs">销售</span>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-8">
            © 2024 代账业务管理平台 · 保留所有权利
          </p>
        </div>
      </div>
    </div>
  );
}
