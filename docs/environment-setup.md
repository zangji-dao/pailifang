# 环境配置说明

## 概述

本项目采用**代码统一、环境变量驱动**的架构设计，确保沙箱环境和生产环境使用完全相同的代码，无需手动修改配置文件。

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        Git 仓库                                 │
│  同一份代码，沙箱和生产环境自动适配                              │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌─────────────────────┐     ┌─────────────────────┐
        │      沙箱环境       │     │      生产环境       │
        ├─────────────────────┤     ├─────────────────────┤
        │ COZE_PROJECT_ENV=DEV│     │ COZE_PROJECT_ENV=PROD│
        │ 数据库: pi_cube_dev │     │ 数据库: pi_cube     │
        │ 前端: 5000          │     │ 前端: 4000          │
        │ 后端: 4001          │     │ 后端: 4001          │
        └─────────────────────┘     └─────────────────────┘
```

## 环境判断逻辑

代码通过以下方式自动判断当前环境：

1. **优先级1**：`COZE_PROJECT_ENV` 环境变量
   - `DEV` → 沙箱环境
   - `PROD` → 生产环境

2. **优先级2**：`COZE_PROJECT_DOMAIN_DEFAULT` 域名判断
   - 包含 `dev.coze.site` → 沙箱环境
   - 其他 → 生产环境

3. **默认**：生产环境

## 数据库隔离

| 环境 | 数据库名 | 说明 |
|------|---------|------|
| 沙箱 | `pi_cube_dev` | 开发测试数据，可随时重置 |
| 生产 | `pi_cube` | 生产数据，谨慎操作 |

## 敏感信息管理

以下敏感信息通过系统环境变量注入，**不硬编码在代码中**：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `PG_PASSWORD` | 数据库密码 | `PiCube2024` |
| `ALIPAY_PRIVATE_KEY` | 支付宝私钥 | MIIEv... |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | MIIBI... |

## 快速开始

### 沙箱环境

```bash
# 1. 初始化测试数据库（首次）
./scripts/init-dev-db.sh

# 2. 启动服务（自动启动前后端）
./deploy.sh sandbox
```

### 生产环境

```bash
# 在生产服务器上执行
COZE_PROJECT_ENV=PROD PG_PASSWORD=your_password ./deploy.sh production
```

### 同步代码到生产

```bash
# 从沙箱同步代码到生产服务器
./deploy.sh sync
```

## 目录结构

```
.
├── config/
│   └── env.ts              # 前端统一环境配置
├── backend/
│   └── src/
│       ├── config/
│       │   └── env.ts      # 后端统一环境配置
│       └── index.ts        # 后端入口
├── src/
│   └── lib/
│       └── apiClient.ts    # 前端 API 客户端
├── scripts/
│   ├── dev.sh              # 沙箱启动脚本
│   ├── start.sh            # 生产启动脚本
│   └── init-dev-db.sh      # 初始化测试数据库
└── deploy.sh               # 统一部署脚本
```

## 常见问题

### Q: 沙箱环境如何连接后端？

沙箱环境会自动启动独立的后端服务（端口 4001），前端通过 `localhost:4001` 访问。

### Q: 如何重置测试数据库？

```bash
# 删除并重建测试数据库
psql -h 152.136.12.122 -U pi_user -d postgres -c "DROP DATABASE IF EXISTS pi_cube_dev;"
./scripts/init-dev-db.sh
```

### Q: 如何查看当前环境？

访问 `/health` 接口，会返回当前环境信息：

```json
{
  "status": "ok",
  "environment": "sandbox",
  "database": "pi_cube_dev"
}
```

### Q: 敏感信息如何注入？

在启动服务时通过环境变量传入：

```bash
# 沙箱环境
PG_PASSWORD=xxx ALIPAY_PRIVATE_KEY=xxx ./deploy.sh sandbox

# 生产环境
PG_PASSWORD=xxx ALIPAY_PRIVATE_KEY=xxx ./deploy.sh production
```
