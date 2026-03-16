/**
 * Π立方企业服务中心 - 小程序端架构文档
 * 
 * 技术栈: Taro 3 + React + TypeScript + Sass
 * 
 * 目录结构:
 * src/
 * ├── app.tsx            # 应用入口
 * ├── app.config.ts      # 应用配置（页面路由、tabBar）
 * ├── app.scss           # 全局样式
 * ├── pages/             # 页面
 * │   ├── index/         # 首页
 * │   ├── products/      # 服务商品
 * │   ├── cart/          # 购物车
 * │   ├── orders/        # 订单
 * │   ├── profile/       # 个人中心
 * │   └── user/          # 登录注册
 * ├── components/        # 公共组件
 * │   ├── ProductCard/   # 商品卡片
 * │   ├── OrderCard/     # 订单卡片
 * │   ├── NavBar/        # 导航栏
 * │   └── ...
 * ├── services/          # API服务
 * │   ├── request.ts     # 请求封装
 * │   ├── auth.ts        # 认证API
 * │   ├── product.ts     # 商品API
 * │   └── order.ts       # 订单API
 * ├── store/             # 状态管理
 * │   ├── index.ts       # Store入口
 * │   ├── user.ts        # 用户状态
 * │   └── cart.ts        # 购物车状态
 * ├── utils/             # 工具函数
 * │   ├── storage.ts     # 本地存储
 * │   ├── format.ts      # 格式化
 * │   └── validate.ts    # 验证
 * └── assets/            # 静态资源
 *     └── images/        # 图片资源
 * 
 * 页面规划:
 * 
 * 1. 首页 (index)
 *    - 搜索栏
 *    - 轮播图Banner
 *    - 服务分类入口
 *    - 热门服务推荐
 *    - 活动专区
 * 
 * 2. 服务列表 (products)
 *    - 分类筛选
 *    - 服务列表
 *    - 服务详情
 *    - 服务评价
 * 
 * 3. 购物车 (cart)
 *    - 购物车列表
 *    - 数量调整
 *    - 结算下单
 * 
 * 4. 订单管理 (orders)
 *    - 订单列表（全部/待付款/待服务/服务中/已完成）
 *    - 订单详情
 *    - 订单进度
 *    - 申请售后
 * 
 * 5. 个人中心 (profile)
 *    - 用户信息
 *    - 订单快捷入口
 *    - 我的企业
 *    - 服务记录
 *    - 发票管理
 *    - 消息通知
 *    - 设置
 * 
 * 6. 登录注册 (user)
 *    - 微信一键登录
 *    - 手机号登录
 *    - 注册页面
 * 
 * 编译命令:
 * - pnpm dev:weapp    # 微信小程序开发模式
 * - pnpm build:weapp  # 微信小程序生产构建
 * - pnpm dev:h5       # H5 开发模式
 * - pnpm build:h5     # H5 生产构建
 */
