/**
 * Π立方企业服务中心 - 后端架构文档
 * 
 * 目录结构:
 * src/
 * ├── index.ts           # 应用入口
 * ├── routes/            # 路由定义
 * │   ├── auth.ts        # 认证路由
 * │   ├── users.ts       # 用户路由
 * │   ├── products.ts    # 商品路由
 * │   ├── orders.ts      # 订单路由
 * │   └── ...
 * ├── controllers/       # 控制器（处理请求）
 * ├── services/          # 业务逻辑层
 * ├── middleware/        # 中间件
 * │   ├── auth.ts        # JWT认证中间件
 * │   ├── rbac.ts        # 权限控制中间件
 * │   └── validate.ts    # 请求验证中间件
 * ├── models/            # 数据模型（Drizzle Schema）
 * ├── utils/             # 工具函数
 * └── types/             # TypeScript 类型定义
 * 
 * API 端点规划:
 * 
 * 1. 认证模块 /api/auth
 *    - POST /login          # 登录
 *    - POST /logout         # 登出
 *    - POST /refresh        # 刷新Token
 *    - POST /wechat-login   # 微信小程序登录
 * 
 * 2. 用户模块 /api/users
 *    - GET    /             # 用户列表（Admin）
 *    - POST   /             # 创建用户（Admin）
 *    - GET    /:id          # 用户详情
 *    - PUT    /:id          # 更新用户
 *    - DELETE /:id          # 删除用户（Admin）
 *    - PUT    /:id/role     # 分配角色（Admin）
 * 
 * 3. 商品模块 /api/products
 *    - GET    /             # 商品列表
 *    - POST   /             # 创建商品
 *    - GET    /:id          # 商品详情
 *    - PUT    /:id          # 更新商品
 *    - DELETE /:id          # 删除商品
 *    - PUT    /:id/status   # 上架/下架
 * 
 * 4. 订单模块 /api/orders
 *    - GET    /             # 订单列表
 *    - POST   /             # 创建订单
 *    - GET    /:id          # 订单详情
 *    - PUT    /:id/status   # 更新订单状态
 *    - POST   /:id/pay      # 支付订单
 * 
 * 5. 客户模块 /api/customers
 *    - GET    /             # 客户列表
 *    - GET    /:id          # 客户详情
 *    - GET    /:id/orders   # 客户订单
 *    - GET    /:id/services # 客户服务记录
 * 
 * 6. 工单模块 /api/work-orders
 *    - GET    /             # 工单列表
 *    - POST   /             # 创建工单
 *    - GET    /:id          # 工单详情
 *    - PUT    /:id          # 更新工单
 *    - PUT    /:id/assign   # 分配工单
 *    - PUT    /:id/complete # 完成工单
 * 
 * 7. 权限模块 /api/permissions
 *    - GET    /roles        # 角色列表
 *    - POST   /roles        # 创建角色
 *    - GET    /roles/:id    # 角色详情
 *    - PUT    /roles/:id    # 更新角色
 *    - DELETE /roles/:id    # 删除角色
 * 
 * 权限角色设计:
 * - admin: 系统管理员（全部权限）
 * - operator: 运营人员（商品、订单管理）
 * - accountant: 会计（记账、结算）
 * - sales: 销售（客户、工单）
 * - customer: 客户（小程序端用户）
 */
