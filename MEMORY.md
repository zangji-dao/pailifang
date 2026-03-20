# Π立方 - 项目记忆文档

> 本文档记录项目开发过程中的关键决策、规范和注意事项，确保AI助手在多轮对话中保持一致性。

---

## 🔒 第零章：强制准则

> ⚠️ **不可修改，任何项目都必须严格遵守**

### 0.1 核心设计原则

| 原则 | 全称 | 说明 |
|------|------|------|
| **DRY** | Don't Repeat Yourself | 相同代码出现2次必须提取 |
| **KISS** | Keep It Simple, Stupid | 保持简单，避免过度设计 |
| **YAGNI** | You Aren't Gonna Need It | 只实现当前需要的功能 |
| **SRP** | Single Responsibility | 一个函数/类只做一件事 |

### 0.2 代码质量底线

| 类型 | 上限 | 超限处理 |
|------|------|----------|
| 函数长度 | **50 行** | 拆分为子函数 |
| 文件长度 | **500 行** | 拆分为多个模块 |
| 参数数量 | **4 个** | 用对象封装 |
| 嵌套层级 | **3 层** | 提取函数 |

### 0.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getUserById` |
| 常量 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| 类/组件 | PascalCase | `UserService` |
| 文件(工具) | kebab-case | `user-service.ts` |
| 布尔值 | is/has/can 前缀 | `isValid`, `hasPermission` |
| 事件处理 | handle 前缀 | `handleClick` |

### 0.4 类型安全

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

### 0.5 错误处理

```typescript
// 所有异步操作必须 try-catch
try {
  const result = await fetchData();
  return result;
} catch (error) {
  showToast('操作失败，请稍后重试'); // 用户友好提示
  console.error(error);              // 记录错误
  throw error;
}
```

- **所有 async 必须 try-catch**
- **用户操作失败必须友好提示**
- **禁止向前端暴露技术错误信息**

### 0.6 安全红线

| 规则 | 说明 |
|------|------|
| 禁止硬编码密钥 | Token/密码/API Key 必须走环境变量 |
| 用户输入必须校验 | 长度、格式、类型都要验证 |
| 敏感数据禁止存前端 | 不用 localStorage 存 token |
| 权限必须后端验证 | 前端校验只是体验优化 |

### 0.7 注释规范

**必须注释**：
- 复杂业务逻辑说明"为什么"
- 公共函数必须有 JSDoc
- TODO 必须带日期和说明

**禁止注释**：
- 显而易见的代码说明
- 注释掉的代码（直接删除）

### 0.8 性能原则

- **列表渲染必须使用唯一 key**（禁止用 index）
- **避免内联函数和对象**（导致不必要的重渲染）
- **大列表（>100条）使用虚拟滚动**
- **图片必须设置尺寸**，避免布局抖动

---

## 📌 待办事项

> 当前正在处理或待处理的任务

| 状态 | 任务 | 备注 |
|------|------|------|
| ⏳ | 重构超长文件 | 15+文件超过500行 |
| ⏳ | 修复 any 类型 | 30+处需要类型定义 |
| ⏳ | 补充 try-catch | 32处 async 缺少错误处理 |

---

## ⚡ 临时决策

> 本轮对话中达成的共识

| 日期 | 决策内容 | 状态 |
|------|----------|------|
| 2026-03-20 | 裁剪工具放弃透视裁剪，统一使用矩形裁剪 | ✅ 已固化 |

---

## ⚠️ 已知问题

> 当前存在的问题，解决后标记已修复

| 状态 | 问题描述 | 影响范围 | 备注 |
|------|----------|----------|------|
| ✅ | 数据库密码硬编码 | 安全风险 | 已修复：db.ts 必须用环境变量 |
| ✅ | 配置文件未使用 | 环境切换风险 | 已修复：API 路由已重构 |
| ✅ | 硬编码 API 地址 | 9处 | 已修复：使用配置文件 |
| ⏳ | 文件超长（>500行） | 15+文件 | 待重构 |
| ⏳ | any 类型 | 30+处 | 待修复 |
| ⏳ | 缺少 try-catch | 32处 | 待补充 |

---

## 一、环境配置规范

### 1. 环境区分规则
```javascript
// 所有代码必须自动区分环境：
// - process.env.NODE_ENV === 'development'  → 沙箱/Coze环境
// - process.env.NODE_ENV === 'production'   → 生产环境
```

### 2. 配置文件结构
```
src/config/
  ├── config.dev.ts    # 开发环境配置
  ├── config.prod.ts   # 生产环境配置
  └── index.ts         # 配置入口，自动切换
```

### 3. 核心原则
- **API 地址、请求前缀、路由基地址、跨域配置必须按环境自动切换**
- **不要写死地址，全部走配置文件**
- **敏感信息（密钥、Token）必须通过环境变量注入**

### 4. 使用方式
```typescript
// 正确示例
import config from '@/config';

const apiBaseUrl = config.api.baseUrl;
const uploadUrl = config.storage.uploadUrl;

// 错误示例（禁止）
const apiBaseUrl = 'https://api.example.com';
```

---

## 二、技术栈


| 类型 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 |
| 数据库 | PostgreSQL (Supabase) + Drizzle ORM |
| 存储 | S3 兼容对象存储 |
| 包管理 | pnpm (禁止 npm/yarn) |

---

## 三、目录结构

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

## 四、核心功能模块

### 4.1 入驻申请表单
- **路径**: `/dashboard/base/applications/new`
- **步骤**: 基本信息 → 地址信息 → 人员信息 → 股东信息 → 经营信息
- **裁剪工具**: `src/components/image-cropper.tsx`

### 4.2 图片裁剪
- **组件**: `ImageCropper`
- **比例**: 身份证 1.58:1，营业执照 1.41:1
- **模式**: 矩形裁剪（可调整大小和位置）
- **注意**: 放弃透视裁剪，透视变换算法存在问题

### 4.3 职务管理
- **必填职务**: 法人代表、监事、财务负责人、e窗通登录联系人
- **约束**: 
  - 每个职务只能由一人担任
  - 法人和监事不能是同一人
  - 监事和财务负责人不能是同一人

### 4.4 企业股东营业执照
- **正本**: licenseOriginalKey / licenseOriginalUrl
- **副本**: licenseCopyKey / licenseCopyUrl
- **裁剪比例**: 1.41:1（A4横版比例）

---

## 五、数据库字段

### 5.1 Shareholder（股东）
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

---

## 六、开发规范（样式相关）

### 6.1 颜色规范
- **禁止**使用 Hex/RGB 硬编码颜色
- **禁止**使用 Tailwind 原生色盘（如 `bg-orange-500`）
- **必须**使用语义化变量（`bg-background`, `text-foreground`, `bg-card`）

### 6.2 端口规范
- Web 服务**必须**运行在 5000 端口
- 禁止杀死 9000 端口服务

### 6.3 文件存储
- 生成文件优先存储到对象存储
- 本地临时文件存储在 `/tmp` 目录

### 6.4 图片上传
- 所有图片上传需经过裁剪工具
- 裁剪后统一输出 JPEG 格式，质量 0.9

---

## 七、变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-03-20 | 重构配置系统：创建 types.ts，统一配置类型，添加 backend 配置 |
| 2026-03-20 | 创建 api-proxy.ts：统一 API 代理逻辑，消除重复代码 |
| 2026-03-20 | 重构 apiClient.ts：使用配置文件，修复 any 类型 |
| 2026-03-20 | 修复数据库密码硬编码：db.ts 必须通过环境变量配置 |
| 2026-03-20 | 重构所有 API 路由：使用配置文件替代硬编码地址 |
| 2026-03-20 | 新增第零章"强制准则"：通用编程规范（不可修改） |
| 2026-03-20 | 删除编程规范章节（编程规范是通用的，不属于项目记忆） |
| 2026-03-20 | 完善记忆文档结构，增加待办/临时决策/已知问题区域 |
| 2026-03-20 | 企业股东营业执照支持正本和副本上传 |
| 2026-03-20 | 裁剪工具改为矩形裁剪，放弃透视裁剪 |
| 2026-03-20 | 职务唯一性验证，每个职务只能由一人担任 |
| 2026-03-20 | 初始化项目记忆文档，添加环境配置规范 |

---

## 八、检索优先级

> AI 助手在处理问题时，应按以下优先级获取上下文：

1. **用户当前问题** - 明确意图和上下文
2. **本文档** - 固化的项目知识和决策
3. **相关代码** - 实际实现的真相
4. **对话历史** - 补充参考（如用户偏好）
