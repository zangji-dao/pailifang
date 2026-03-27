# 企业入驻管理系统

## 项目概览

企业入驻管理系统，支持企业从申请到入驻的完整流程管理。系统支持两种企业类型：
- **入驻企业 (tenant)**：在基地内注册的企业，需要工位号、地址分配、工商注册、合同签订、费用缴纳等完整流程
- **服务企业 (non_tenant)**：仅享受服务的企业，流程简化，支持状态循环

## 技术栈

- **框架**: Next.js 16 (App Router)
- **前端**: React 19, TypeScript 5
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **编码规范**: Airbnb

## 核心业务逻辑

### 入驻企业流程状态

| 状态 | 标签 | 说明 |
|------|------|------|
| `pending_address` | 待分配地址 | 新申请，等待分配工位号 |
| `pending_registration` | 待工商注册 | 已分配地址，等待上传营业执照 |
| `pending_contract` | 待签合同 | 工商注册完成，等待签订合同 |
| `pending_payment` | 待缴费 | 合同已签，等待缴纳费用 |
| `active` | 入驻中 | 已完成入驻，正常运营 |
| `completed` | 已完成 | 入驻流程完成 |
| `moved_out` | 已迁出 | 企业已迁出基地 |

### 服务企业流程状态

| 状态 | 标签 | 说明 |
|------|------|------|
| `new` | 洽谈中 | 初次接触，尚未建立正式关系 |
| `established` | 已建交 | 已完成企业信息录入，可随时开始服务 |
| `active` | 服务中 | 正在提供服务 |
| `terminated` | 服务终止 | 服务已终止 |

**状态流转**：
- 已建交 → 服务中（点击"开始服务"）
- 服务中 → 已建交（点击"终止服务"）

### 工位号编码规则

工位号格式：`PI` + 基地码(2位) + 随机4位数字
- 示例：`PI012305`
- 工位号不回收，企业退出时不释放

## 目录结构

```
src/
├── app/
│   ├── api/                    # API路由
│   │   ├── enterprises/        # 企业CRUD接口
│   │   ├── registration-numbers/ # 工位号管理接口
│   │   ├── industries/         # 行业管理接口
│   │   └── storage/            # 文件上传接口
│   ├── dashboard/
│   │   ├── base/tenants/       # 企业管理页面
│   │   │   ├── page.tsx        # 企业列表页
│   │   │   ├── create/         # 新建企业流程
│   │   │   └── [id]/           # 企业详情页
│   │   └── _components/        # 共享组件
│   └── ...
├── components/
│   └── ui/                     # shadcn/ui组件
├── hooks/                      # 自定义Hooks
└── lib/                        # 工具库

```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（端口5000，支持热更新）
pnpm run dev

# 类型检查
npx tsc --noEmit

# 构建生产版本
pnpm run build

# 启动生产服务
pnpm run start
```

## 关键组件

### 企业列表页 (`src/app/dashboard/base/tenants/page.tsx`)
- 支持Tab切换（入驻企业/服务企业）
- 状态卡片统计
- 搜索和筛选功能
- 快速操作按钮（继续注册、开始/终止服务、查看、编辑）

### 企业详情页 (`src/app/dashboard/base/tenants/[id]/page.tsx`)
- 企业基本信息展示
- 状态流转操作（服务企业）
- 编辑、迁出功能

### 新建企业流程 (`src/app/dashboard/base/tenants/create/`)
- 多步骤表单
- 根据企业类型动态调整步骤
- 营业执照OCR识别
- 工位号自动分配

## API接口

### 企业管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/enterprises` | 获取企业列表 |
| POST | `/api/enterprises` | 创建企业 |
| GET | `/api/enterprises/[id]` | 获取企业详情 |
| PUT | `/api/enterprises/[id]` | 更新企业信息 |
| DELETE | `/api/enterprises/[id]` | 删除企业 |

### 工位号管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/registration-numbers` | 获取工位号列表 |
| POST | `/api/registration-numbers` | 创建工位号 |
| PUT | `/api/registration-numbers/[id]` | 更新工位号状态 |

## 注意事项

1. **状态一致性**：服务企业创建后自动设置为 `established`（已建交）状态
2. **状态循环**：服务企业支持"已建交 ↔ 服务中"的状态循环
3. **工位号管理**：工位号不回收，企业退出时不释放
4. **企业名称唯一性**：企业名称不能重复（排除已终止的企业）
