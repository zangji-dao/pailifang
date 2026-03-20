# Π立方 - 项目记忆文档

> 本文档记录项目开发过程中的关键决策、规范和注意事项，确保AI助手在多轮对话中保持一致性。

---

## 一、项目概览

### 1.1 项目简介

**Π立方**是企业服务平台，提供代理记账、工商注册、税务申报、人力资源等一站式企业服务。

### 1.2 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 |
| 数据库 | PostgreSQL (Supabase) + Drizzle ORM |
| 存储 | S3 兼容对象存储 |
| 包管理 | pnpm (禁止 npm/yarn) |

### 1.3 目录结构

```
/workspace/projects/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── dashboard/         # 仪表盘页面
│   │   └── api/               # API 路由
│   ├── components/            # 公共组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── lib/                   # 工具库
│   └── config/               # 配置文件
├── public/                    # 静态资源
├── MEMORY.md                  # 项目记忆文档
└── .coze                      # Coze 配置
```

---

## 二、开发规范

> ⚠️ **强制准则，任何项目都必须严格遵守**

### 2.1 代码质量底线

| 类型 | 上限 | 超限处理 |
|------|------|----------|
| 函数长度 | **50 行** | 拆分为子函数 |
| 文件长度 | **500 行** | 拆分为多个模块 |
| 参数数量 | **4 个** | 用对象封装 |
| 嵌套层级 | **3 层** | 提取函数 |

### 2.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getUserById` |
| 常量 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| 类/组件 | PascalCase | `UserService` |
| 文件(工具) | kebab-case | `user-service.ts` |
| 布尔值 | is/has/can 前缀 | `isValid`, `hasPermission` |
| 事件处理 | handle 前缀 | `handleClick` |

### 2.3 类型安全

```typescript
// ❌ 禁止
const data: any = fetchData();
function process(input) { ... }

// ✅ 必须
interface UserData { id: string; name: string; }
const data: UserData = fetchData();
function process(input: string): void { ... }
```

- **禁止 `any` 类型** - 不确定时用 `unknown`
- **所有函数参数和返回值必须声明类型**
- **API 响应必须定义 interface/type**
- **对象用 interface，联合用 type**

### 2.4 错误处理

```typescript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  toast.error('操作失败，请稍后重试'); // 用户友好提示
  console.error(error);                 // 记录错误
  throw error;
}
```

- **所有 async 必须 try-catch**
- **用户操作失败必须友好提示**
- **禁止向前端暴露技术错误信息**

### 2.5 安全红线

| 规则 | 说明 |
|------|------|
| 禁止硬编码密钥 | Token/密码/API Key 必须走环境变量 |
| 用户输入必须校验 | 长度、格式、类型都要验证 |
| 敏感数据禁止存前端 | 不用 localStorage 存 token |
| 权限必须后端验证 | 前端校验只是体验优化 |

### 2.6 性能原则

- **列表渲染必须使用唯一 key**（禁止用 index）
- **避免内联函数和对象**（导致不必要的重渲染）
- **大列表（>100条）使用虚拟滚动**
- **图片必须设置尺寸**，避免布局抖动

---

## 三、设计规范

> 系统的视觉风格和组件使用规范

### 3.1 品牌色

系统采用 **Amber（琥珀色）+ Orange（橙色）** 渐变作为品牌主色调。

| 用途 | 样式类 |
|------|--------|
| 主按钮 | `bg-gradient-to-r from-amber-500 to-orange-500` |
| 主按钮悬停 | `hover:from-amber-600 hover:to-orange-600` |
| 浅色背景 | `bg-gradient-to-br from-amber-50 to-orange-50` |
| 强调文字 | `text-amber-600` |
| 图标/装饰 | `text-amber-500` |
| 边框 | `border-amber-100`, `border-amber-200` |

```tsx
// 主按钮
<Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
  确认提交
</Button>

// Logo/头像
<div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">Π</div>
```

### 3.2 中性色

采用 **Slate（蓝灰）** 色系。

| 用途 | 样式类 |
|------|--------|
| 页面背景 | `bg-white`, `bg-slate-50` |
| 主文字 | `text-slate-900` |
| 次要文字 | `text-slate-600` |
| 辅助文字 | `text-slate-400` |
| 边框 | `border-slate-200` |

### 3.3 功能色

| 类型 | 颜色 | 使用场景 |
|------|------|----------|
| 成功 | `emerald-*` | 已完成、通过 |
| 警告 | `amber-*` | 待处理、注意 |
| 错误 | `red-*`, `destructive` | 失败、删除 |
| 信息 | `blue-*` | 进行中 |

```tsx
<Badge className="bg-emerald-50 text-emerald-600">已完成</Badge>
<Badge className="bg-blue-50 text-blue-600">进行中</Badge>
<Badge className="bg-amber-50 text-amber-600">待审批</Badge>
<Badge className="bg-red-50 text-red-600">已驳回</Badge>
```

### 3.4 字体

| 类型 | 字体 |
|------|------|
| 中文 | `Noto Sans SC` |
| 英文/数字 | `Inter` |
| 代码/金额 | 系统等宽字体 |

### 3.5 圆角

基础圆角值：`--radius: 0.625rem`（10px）

| 样式类 | 使用场景 |
|--------|----------|
| `rounded-sm` | 小元素、标签 |
| `rounded-md` | 按钮、输入框 |
| `rounded-lg` | 卡片、弹窗 |
| `rounded-xl` | 大卡片 |
| `rounded-full` | 头像、圆形按钮 |

### 3.6 弹窗规范

> **禁止使用原生弹窗**（`alert`、`confirm`、`prompt`）

**Toast 提示**：
```typescript
import { toast } from '@/lib/notify';

toast.success('操作成功');
toast.error('操作失败');
toast.warning('请注意');
toast.info('提示信息');
toast.loading('加载中...');
```

**确认弹窗**：
```typescript
import { useConfirm } from '@/components/confirm-dialog';

const confirm = useConfirm();
const result = await confirm({
  title: '确认删除',
  description: '删除后将无法恢复',
  variant: 'destructive', // 危险操作（红色按钮）
});
```

### 3.7 UI 组件库

使用 **shadcn/ui**，路径：`@/components/ui/*`

**使用原则**：
1. 优先使用 shadcn/ui 组件
2. 通过 `className` 传入自定义样式
3. 遵循语义化变量（`bg-background`, `text-foreground`）
4. 禁止硬编码颜色值

---

## 四、环境配置

### 4.1 环境区分

```javascript
// 开发环境：process.env.NODE_ENV === 'development'
// 生产环境：process.env.NODE_ENV === 'production'
```

### 4.2 配置文件

```
src/config/
  ├── config.dev.ts    # 开发环境配置
  ├── config.prod.ts   # 生产环境配置
  └── index.ts         # 配置入口，自动切换
```

### 4.3 核心原则

- **API 地址、请求前缀必须按环境自动切换**
- **禁止写死地址，全部走配置文件**
- **敏感信息必须通过环境变量注入**

```typescript
// ✅ 正确
import config from '@/config';
const apiBaseUrl = config.api.baseUrl;

// ❌ 禁止
const apiBaseUrl = 'https://api.example.com';
```

---

## 五、核心功能模块

### 5.1 入驻申请表单

- **路径**: `/dashboard/base/applications/new`
- **步骤**: 基本信息 → 地址信息 → 人员信息 → 股东信息 → 经营信息
- **裁剪工具**: `src/components/image-cropper.tsx`

### 5.2 图片裁剪

- **比例**: 身份证 1.58:1，营业执照 1.41:1
- **模式**: 矩形裁剪（放弃透视裁剪）
- **输出**: JPEG 格式，质量 0.9

### 5.3 职务管理

- **必填职务**: 法人代表、监事、财务负责人、e窗通登录联系人
- **约束**: 每个职务只能由一人担任；法人和监事不能是同一人

### 5.4 企业股东营业执照

- **正本**: `licenseOriginalKey` / `licenseOriginalUrl`
- **副本**: `licenseCopyKey` / `licenseCopyUrl`
- **裁剪比例**: 1.41:1（A4横版）

---

## 六、数据库设计

### 6.1 Shareholder（股东）

```typescript
interface Shareholder {
  type: 'natural' | 'enterprise';
  name: string;
  investment: string;
  phone: string;
  // 自然人股东 - 身份证
  idCardFrontKey?: string;
  idCardFrontUrl?: string;
  idCardBackKey?: string;
  idCardBackUrl?: string;
  // 企业股东 - 营业执照
  licenseOriginalKey?: string;
  licenseOriginalUrl?: string;
  licenseCopyKey?: string;
  licenseCopyUrl?: string;
}
```

### 6.2 入驻相关表

| 表名 | 说明 |
|------|------|
| `pi_settlement_applications` | 入驻申请表 |
| `pi_settlement_processes` | 入驻流程表（阶段进度） |
| `pi_registered_addresses` | 注册地址表 |
| `pi_contracts` | 合同表 |

---

## 七、任务追踪

### 7.1 待办事项

| 状态 | 任务 | 备注 |
|------|------|------|
| ✅ | 重构超长文件 | 已完成 5 个核心文件 |
| ✅ | 修复 any 类型 | 已完成 |
| ⏳ | 开发入驻申请流程 | 待开始 |

### 7.2 已知问题

| 状态 | 问题 | 解决方案 |
|------|------|----------|
| ✅ | 数据库密码硬编码 | 已修复：使用环境变量 |
| ✅ | 硬编码 API 地址 | 已修复：使用配置文件 |
| ✅ | any 类型 | 已修复：定义具体类型 |
| ⏳ | 文件超长（>500行） | 部分已完成，剩余见第八章 |

### 7.3 临时决策

| 日期 | 决策 | 状态 |
|------|------|------|
| 2026-03-20 | 裁剪工具放弃透视裁剪 | ✅ 已固化 |

---

## 八、文件重构进度

### 8.1 已完成

| 文件 | 原行数 | 现行数 |
|------|--------|--------|
| `applications/[id]/page.tsx` | 2056 | ~200 |
| `applications/new/page.tsx` | 1837 | 197 |
| `marketing/publish/page.tsx` | 1008 | 105 |
| `base/sites/[id]/page.tsx` | 847 | 183 |
| `dashboard/layout.tsx` | 809 | 85 |

### 8.2 待重构

| 文件 | 行数 |
|------|------|
| `accounting/page.tsx` | 859 |
| `hr/training/page.tsx` | 777 |
| `hr/recruitment/page.tsx` | 757 |
| `hr/payroll/page.tsx` | 726 |

### 8.3 拆分策略

1. **类型定义** → `types.ts`
2. **常量配置** → `constants.ts`
3. **状态和逻辑** → `useXxx.ts` hook
4. **UI 组件** → `_components/` 目录

---

## 九、变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-03-20 | 新增设计规范章节 |
| 2026-03-20 | 创建全局弹窗系统（toast + confirm） |
| 2026-03-20 | 完成 dashboard/layout.tsx 重构 |
| 2026-03-20 | 完成 base/sites/[id]/page.tsx 重构 |
| 2026-03-20 | 重构配置系统和 API 代理 |
| 2026-03-20 | 修复数据库密码硬编码问题 |
| 2026-03-20 | 初始化项目记忆文档 |

---

## 十、检索优先级

AI 助手在处理问题时，应按以下优先级获取上下文：

1. **用户当前问题** - 明确意图和上下文
2. **本文档** - 固化的项目知识和决策
3. **相关代码** - 实际实现的真相
4. **对话历史** - 补充参考
