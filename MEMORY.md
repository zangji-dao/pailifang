# Π立方 - 项目记忆文档

> 本文档记录项目开发过程中的关键决策、规范和注意事项，确保AI助手在多轮对话中保持一致性。

---

## 📌 待办事项

> 当前正在处理或待处理的任务，完成后移至变更记录

| 状态 | 任务 | 备注 |
|------|------|------|
| ✅ | 创建项目记忆文档（MEMORY.md） | 已完成 |
| ✅ | 创建环境配置系统（config.dev.ts/config.prod.ts/index.ts） | 已完成 |
| ✅ | 建立编程规范（代码规模、类型安全、错误处理等） | 已完成 |

---

## ⚡ 临时决策

> 本轮对话中达成的共识，下次对话需确认或已固化则移至相关章节

| 日期 | 决策内容 | 状态 |
|------|----------|------|
| 2026-03-20 | 裁剪工具放弃透视裁剪，统一使用矩形裁剪 | ✅ 已固化 |

---

## ⚠️ 已知问题

> 当前存在的问题，解决后标记已修复

| 状态 | 问题描述 | 影响范围 | 备注 |
|------|----------|----------|------|
| - | 暂无已知问题 | - | - |

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

## 六、编程规范（强制）

> 以下规则为硬性约束，违反即视为代码缺陷

### 7.1 代码规模限制

| 类型 | 上限 | 超限处理 |
|------|------|----------|
| 单文件 | **500 行** | 拆分为多个模块 |
| 单函数 | **50 行** | 拆分为子函数 |
| 单组件 | **200 行** | 拆分子组件 |
| 单次提交 | **400 行** | 拆分为多次提交 |

### 7.2 禁止重复

```
规则：相同代码出现 2 次 → 必须提取
      相同逻辑出现 2 次 → 必须封装
      相似组件出现 2 次 → 必须抽象
```

**执行步骤**：
1. 写代码前先搜索项目内是否已有实现
2. 优先使用 shadcn/ui 组件
3. 优先复用项目内公共组件和工具函数

### 7.3 类型安全

```typescript
// ❌ 禁止
const data: any = fetchData();
function process(input) { ... }

// ✅ 必须
interface UserData { id: string; name: string; }
const data: UserData = fetchData();
function process(input: string): void { ... }
```

- **禁止 `any` 类型** - 实在不知道用 `unknown`
- **API 响应必须定义类型** - 不信任后端返回
- **对象用 interface，联合用 type**

### 7.4 错误处理

```typescript
// ❌ 禁止
const response = await fetch(url);
const data = response.json();

// ✅ 必须
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('请求失败');
  const data = await response.json();
} catch (error) {
  alert('操作失败，请稍后重试');
  console.error(error);
}
```

- **所有 async 必须 try-catch**
- **用户操作失败必须友好提示**
- **禁止向前端暴露技术错误信息**

### 7.5 安全红线

| 规则 | 说明 |
|------|------|
| 禁止硬编码密钥 | Token/密码/API Key 必须走环境变量 |
| 禁止前端存敏感信息 | localStorage 不存 token，用 httpOnly cookie |
| 用户输入必须校验 | 长度、格式、类型都要校验 |
| 权限必须后端验证 | 前端校验只是体验优化 |

### 7.6 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `ImageCropper` |
| 函数/变量 | camelCase | `handleUpload` |
| 常量 | UPPER_SNAKE | `MAX_FILE_SIZE` |
| 文件(组件) | PascalCase | `Button.tsx` |
| 文件(工具) | kebab-case | `date-utils.ts` |
| 文件(页面) | 小写 | `page.tsx` |

**命名必须表意**：
- `handleXxx` - 事件处理
- `fetchXxx` - 数据获取
- `validateXxx` - 校验逻辑
- `transformXxx` - 数据转换
- `isXxx` / `hasXxx` / `canXxx` - 布尔判断

### 7.7 注释规范

```typescript
// ✅ 必须注释的情况

// 1. 复杂业务逻辑
// 根据申请类型决定显示哪些地址字段：
// - 新建企业：隐藏原注册地址，实际经营地址显示"系统分配"
// - 迁移企业：显示迁移前地址卡片

// 2. 公共函数必须写 JSDoc
/**
 * 计算透视变换矩阵
 * @param srcPoints 源四点坐标 [左上, 右上, 右下, 左下]
 * @param dstWidth 目标宽度
 * @param dstHeight 目标高度
 * @returns 3x3 变换矩阵（归一化）
 */

// 3. TODO 必须带信息
// TODO: 2026-03-20 by AI - 添加图片压缩功能
```

**禁止无意义注释**：
```typescript
// ❌ 禁止
// 初始化变量
let count = 0;

// 循环遍历
for (let i = 0; i < list.length; i++) { ... }
```

### 7.8 性能底线

- **列表必须加 key** - 且不能用 index
- **大列表用虚拟滚动** - 超过 100 条
- **图片必须设尺寸** - 避免布局抖动
- **避免内联函数** - 使用 useCallback
- **避免内联对象** - 使用 useMemo 或提取常量

### 7.9 Git 提交规范

```
feat:     新功能
fix:      修复 bug
docs:     文档更新
refactor: 重构（不是新功能也不是修复）
style:    格式调整（不影响逻辑）
chore:    构建/工具/依赖
test:     测试相关
```

**提交信息要求**：
- 标题不超过 50 字符
- 使用中文描述
- 一个提交只做一件事

### 7.10 代码审查清单

每次提交前自查：

- [ ] 文件是否超过 500 行？
- [ ] 是否有重复代码？
- [ ] 是否使用了 any？
- [ ] async 是否有 try-catch？
- [ ] 是否有硬编码的配置？
- [ ] 用户操作失败是否有提示？
- [ ] 列表是否用了正确的 key？

---

## 七、开发规范（样式相关）

### 7.1 颜色规范
- **禁止**使用 Hex/RGB 硬编码颜色
- **禁止**使用 Tailwind 原生色盘（如 `bg-orange-500`）
- **必须**使用语义化变量（`bg-background`, `text-foreground`, `bg-card`）

### 7.2 端口规范
- Web 服务**必须**运行在 5000 端口
- 禁止杀死 9000 端口服务

### 7.3 文件存储
- 生成文件优先存储到对象存储
- 本地临时文件存储在 `/tmp` 目录

### 7.4 图片上传
- 所有图片上传需经过裁剪工具
- 裁剪后统一输出 JPEG 格式，质量 0.9

---

## 八、变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-03-20 | 新增编程规范章节（代码规模、复用、类型安全、错误处理等） |
| 2026-03-20 | 完善记忆文档结构，增加待办/临时决策/已知问题区域 |
| 2026-03-20 | 企业股东营业执照支持正本和副本上传 |
| 2026-03-20 | 裁剪工具改为矩形裁剪，放弃透视裁剪 |
| 2026-03-20 | 职务唯一性验证，每个职务只能由一人担任 |
| 2026-03-20 | 初始化项目记忆文档，添加环境配置规范 |

---

## 九、检索优先级

> AI 助手在处理问题时，应按以下优先级获取上下文：

1. **用户当前问题** - 明确意图和上下文
2. **本文档** - 固化的项目知识和决策
3. **相关代码** - 实际实现的真相
4. **对话历史** - 补充参考（如用户偏好）
