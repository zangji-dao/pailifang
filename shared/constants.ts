/**
 * Π立方企业服务中心 - 共享常量定义
 */

// 服务分类
export const PRODUCT_CATEGORIES = [
  { id: 'accounting', name: '代理记账', icon: '📒', description: '专业记账服务' },
  { id: 'registration', name: '公司注册', icon: '🏢', description: '公司注册服务' },
  { id: 'tax', name: '税务申报', icon: '📊', description: '税务申报服务' },
  { id: 'trademark', name: '商标注册', icon: '®️', description: '商标注册服务' },
  { id: 'qualification', name: '资质办理', icon: '📋', description: '资质办理服务' },
  { id: 'audit', name: '审计验资', icon: '🔍', description: '审计验资服务' },
  { id: 'other', name: '其他服务', icon: '➕', description: '其他增值服务' },
] as const

// 订单状态
export const ORDER_STATUS = [
  { id: 'pending', name: '待付款', color: '#F59E0B' },
  { id: 'paid', name: '已付款', color: '#3B82F6' },
  { id: 'processing', name: '服务中', color: '#8B5CF6' },
  { id: 'completed', name: '已完成', color: '#10B981' },
  { id: 'cancelled', name: '已取消', color: '#6B7280' },
  { id: 'refunded', name: '已退款', color: '#EF4444' },
] as const

// 工单状态
export const WORK_ORDER_STATUS = [
  { id: 'pending', name: '待处理', color: '#F59E0B' },
  { id: 'assigned', name: '已分配', color: '#3B82F6' },
  { id: 'processing', name: '处理中', color: '#8B5CF6' },
  { id: 'completed', name: '已完成', color: '#10B981' },
  { id: 'cancelled', name: '已取消', color: '#6B7280' },
] as const

// 用户角色
export const USER_ROLES = [
  { id: 'admin', name: '系统管理员', description: '拥有全部权限' },
  { id: 'operator', name: '运营人员', description: '管理商品、订单' },
  { id: 'accountant', name: '会计', description: '记账、结算' },
  { id: 'sales', name: '销售', description: '客户、工单管理' },
  { id: 'customer', name: '客户', description: '小程序端用户' },
] as const

// 优先级
export const PRIORITY_LEVELS = [
  { id: 'low', name: '低', color: '#10B981' },
  { id: 'medium', name: '中', color: '#F59E0B' },
  { id: 'high', name: '高', color: '#EF4444' },
  { id: 'urgent', name: '紧急', color: '#DC2626' },
] as const

// API 端点
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    WECHAT_LOGIN: '/auth/wechat-login',
  },
  // 用户
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  // 商品
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    CATEGORIES: '/products/categories',
  },
  // 订单
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    PAY: (id: string) => `/orders/${id}/pay`,
  },
  // 工单
  WORK_ORDERS: {
    LIST: '/work-orders',
    DETAIL: (id: string) => `/work-orders/${id}`,
    CREATE: '/work-orders',
    UPDATE: (id: string) => `/work-orders/${id}`,
    ASSIGN: (id: string) => `/work-orders/${id}/assign`,
    COMPLETE: (id: string) => `/work-orders/${id}/complete`,
  },
  // 角色
  ROLES: {
    LIST: '/roles',
    DETAIL: (id: string) => `/roles/${id}`,
    CREATE: '/roles',
    UPDATE: (id: string) => `/roles/${id}`,
    DELETE: (id: string) => `/roles/${id}`,
  },
} as const
