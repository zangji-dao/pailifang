/**
 * Π立方企业服务中心 - 共享类型定义
 * 
 * 此文件定义了各端（server、miniprogram、admin-console、admin）共用的类型
 */

// ==================== 用户相关 ====================

export type UserRole = 'admin' | 'operator' | 'accountant' | 'sales' | 'customer'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  phone?: string
  email?: string
  password?: string
  wechatCode?: string  // 微信小程序登录
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

// ==================== 商品相关 ====================

export interface Product {
  id: string
  name: string
  description: string
  category: ProductCategory
  price: number
  originalPrice?: number
  unit: string  // 月/次/年
  images: string[]
  details: string
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ProductCategory = 
  | 'accounting'      // 代理记账
  | 'registration'    // 公司注册
  | 'tax'            // 税务申报
  | 'trademark'      // 商标注册
  | 'qualification'  // 资质办理
  | 'audit'          // 审计验资
  | 'other'          // 其他服务

export interface ProductCategoryInfo {
  id: ProductCategory
  name: string
  icon: string
  description: string
}

// ==================== 订单相关 ====================

export interface Order {
  id: string
  orderNo: string
  userId: string
  user: User
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  payAmount: number
  status: OrderStatus
  paymentMethod?: 'wechat' | 'alipay' | 'balance'
  paymentTime?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number
  price: number
  subtotal: number
}

export type OrderStatus = 
  | 'pending'     // 待付款
  | 'paid'        // 已付款
  | 'processing'  // 服务中
  | 'completed'   // 已完成
  | 'cancelled'   // 已取消
  | 'refunded'    // 已退款

// ==================== 工单相关 ====================

export interface WorkOrder {
  id: string
  orderNo: string
  customerId: string
  customer: User
  type: WorkOrderType
  title: string
  description: string
  status: WorkOrderStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  assignee?: User
  attachments: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type WorkOrderType = 
  | 'accounting'     // 记账服务
  | 'tax'           // 税务服务
  | 'registration'  // 注册服务
  | 'audit'         // 审计服务
  | 'consultation'  // 咨询服务
  | 'other'         // 其他

export type WorkOrderStatus = 
  | 'pending'      // 待处理
  | 'assigned'     // 已分配
  | 'processing'   // 处理中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消

// ==================== 权限相关 ====================

export interface Role {
  id: string
  name: string
  code: string
  description: string
  permissions: Permission[]
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  code: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  description: string
}

// ==================== 企业相关 ====================

export interface Company {
  id: string
  userId: string
  name: string
  creditCode: string      // 统一社会信用代码
  legalPerson: string     // 法人
  registeredCapital: number
  businessScope: string
  address: string
  phone: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// ==================== API 响应 ====================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
