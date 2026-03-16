'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    { name: '总用户数', value: '1,234', change: '+12%', trend: 'up', icon: Users },
    { name: '商品数量', value: '56', change: '+3', trend: 'up', icon: Package },
    { name: '本月订单', value: '89', change: '+24%', trend: 'up', icon: ShoppingCart },
    { name: '本月收入', value: '¥128,500', change: '+18%', trend: 'up', icon: DollarSign },
  ]

  const recentUsers = [
    { id: 1, name: '张先生', phone: '138****1234', role: 'customer', time: '10分钟前' },
    { id: 2, name: '李女士', phone: '139****5678', role: 'customer', time: '25分钟前' },
    { id: 3, name: '王会计', phone: '137****9012', role: 'accountant', time: '1小时前' },
    { id: 4, name: '赵销售', phone: '136****3456', role: 'sales', time: '2小时前' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">管理概览</h1>
        <p className="text-slate-500 mt-1">Π立方企业服务中心运营数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                <span className="text-slate-400 ml-2">较上月</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近用户 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近注册用户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{user.time}</p>
                  <p className="text-xs text-amber-600">
                    {user.role === 'customer' ? '客户' : user.role === 'accountant' ? '会计' : '销售'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
