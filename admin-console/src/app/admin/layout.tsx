'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Package, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react'

const navigation = [
  { name: '概览', href: '/admin', icon: LayoutDashboard },
  { name: '用户管理', href: '/admin/users', icon: Users },
  { name: '权限管理', href: '/admin/roles', icon: Shield },
  { name: '商品管理', href: '/admin/products', icon: Package },
  { name: '订单管理', href: '/admin/orders', icon: ShoppingCart },
  { name: '系统设置', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Π</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Π立方</h1>
                <p className="text-xs text-slate-400 -mt-0.5">Admin管理后台</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xs font-medium">AD</span>
              </div>
              <span>Admin</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 侧边栏 */}
      <aside className={`fixed top-14 left-0 z-40 w-56 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="lg:pl-56 pt-14">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
