/**
 * Π立方企业服务中心 - Admin管理后台架构文档
 * 
 * 技术栈: Next.js 14 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
 * 
 * 目录结构:
 * src/
 * ├── app/
 * │   ├── layout.tsx        # 根布局
 * │   ├── globals.css       # 全局样式
 * │   ├── page.tsx          # 首页重定向
 * │   ├── admin/            # 管理后台页面
 * │   │   ├── layout.tsx    # 管理后台布局
 * │   │   ├── page.tsx      # 概览页
 * │   │   ├── users/        # 用户管理
 * │   │   ├── roles/        # 权限管理
 * │   │   ├── products/     # 商品管理
 * │   │   ├── orders/       # 订单管理
 * │   │   └── settings/     # 系统设置
 * │   ├── login/            # 登录页面
 * │   └── api/              # API路由（代理到后端）
 * ├── components/
 * │   ├── ui/               # shadcn/ui 组件
 * │   └── layout/           # 布局组件
 * ├── lib/                  # 工具函数
 * ├── hooks/                # 自定义Hooks
 * ├── store/                # 状态管理
 * └── types/                # TypeScript类型
 * 
 * 功能模块:
 * 
 * 1. 概览 (Dashboard)
 *    - 用户统计
 *    - 订单统计
 *    - 收入统计
 *    - 系统状态
 * 
 * 2. 用户管理
 *    - 用户列表
 *    - 用户详情
 *    - 用户编辑
 *    - 分配角色
 * 
 * 3. 权限管理
 *    - 角色列表
 *    - 角色配置
 *    - 权限分配
 *    - 操作日志
 * 
 * 4. 商品管理
 *    - 商品列表
 *    - 商品分类
 *    - 商品上架/下架
 *    - 价格管理
 * 
 * 5. 订单管理
 *    - 订单列表
 *    - 订单详情
 *    - 订单状态
 *    - 退款处理
 * 
 * 6. 系统设置
 *    - 基础配置
 *    - 微信小程序配置
 *    - 支付配置
 *    - 消息配置
 * 
 * 端口: 3002
 * API代理: /api/* -> http://localhost:3001/api/*
 */
