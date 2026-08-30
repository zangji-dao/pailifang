# Π立方企业服务中心

## 技术架构

- 前端：Next.js 16、React 19、TypeScript、Tailwind CSS 4。
- 后端：Express、TypeScript、Drizzle ORM。
- 数据库：本地 PostgreSQL 14，PostgREST 提供兼容接口。
- 文件存储：生产环境使用腾讯云 COS，本地环境使用 MinIO。
- 文档服务：OnlyOffice Document Server。

## 端口约定

- 本地前端：`5100`。
- 本地后端：`4101`。
- 生产前端：`4000`。
- 生产后端：`4001`。
- `5000/5001` 属于 CHEMICALOOP，不得占用。

## 开发与验证

- 使用 Node.js 20+ 和 pnpm 11.19+。
- 安装依赖：`pnpm install --frozen-lockfile`。
- 本地开发：`pnpm dev`。
- 静态检查：`pnpm validate`。
- 完整构建：`pnpm build`。

## 数据模型

- 基地包含多个物业。
- 物业以独立水表、电表等缴费主体划分。
- 物理空间属于物业，工位属于物理空间。
- 入驻企业注册在基地内并分配工位；服务企业不在基地注册，但可以使用基地服务。
- 运营机构先独立录入，创建基地时从已有机构中选择，同一机构可以运营多个基地。

## 安全规则

- 不得提交 `.env*` 实际配置、`.secrets/`、私钥、访问令牌、数据库密码或运行日志。
- 示例环境文件只能使用明显占位值。
- 不得在代码、文档、提交信息或日志中写入真实凭证。

## 部署规则

- GitHub `main` 是唯一代码源，禁止把服务器上的临时修改作为长期版本。
- 部署前先备份环境文件和数据库，再执行 `git pull --ff-only`。
- 必须先通过 `pnpm ts-check` 和 `pnpm build`，再重载 PM2；`pnpm validate` 还包含存量 ESLint 规则检查，应逐步清理。
- 生产环境由 PM2 管理 `pi-frontend` 与 `pi-backend`，Nginx 代理到 `4000/4001`。
