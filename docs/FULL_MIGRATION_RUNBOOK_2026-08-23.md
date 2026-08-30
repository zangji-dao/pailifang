# Π立方完整迁出操作手册

> 编制日期：2026-08-23

本手册用于把 Coze 项目的源码、PostgreSQL 数据、对象存储文件和运行服务迁移到独立环境。源码与部署改造已经完成。当前采用“全新空数据库和空对象存储”方案，以下旧数据复制步骤仅在未来确有需要时执行。

## 1. 准备条件

- Node.js 20.9 或更高版本。
- pnpm 11。
- Docker Desktop；或者本机安装兼容版本的 `pg_dump` 与 `pg_restore`。
- 原 PostgreSQL 连接串。
- 原 S3/COS/MinIO 存储桶的只读凭据。
- 目标服务器的域名、TLS、支付宝、OnlyOffice、萤石云和 AI 配置。

当前工作机已在受信任目录安装 PostgreSQL 14.24 运行工具，并运行独立本机集群和 MinIO；Docker Desktop 仍未安装。当前方案不复制旧数据，因此不需要原存储桶凭据。

## 2. 当前本机轻量环境

```powershell
pnpm local:setup
pnpm dev
```

服务端口：

- Web：`5100`
- Express API：`4101`
- PostgreSQL：`55432`
- MinIO API / Console：`9100` / `9101`

数据库初始化使用 `database/init/00-extensions.sql` 和 `database/init/10-application-schema.sql`，只创建扩展和 40 张空表，不包含原业务数据。

## 3. 创建 Docker 目标基础设施（可选）

```powershell
Copy-Item .env.compose.example .env.compose
```

修改 `.env.compose`，至少更换：

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `ONLYOFFICE_JWT_SECRET`

先启动数据服务：

```powershell
docker compose --env-file .env.compose up -d postgres minio minio-init onlyoffice
```

目标 PostgreSQL 默认为 `localhost:5432/pi_cube`，MinIO API 默认为 `localhost:9000`。

## 4. 配置迁移凭据（仅迁旧数据时）

```powershell
Copy-Item .env.migration.example .env.migration
```

填写：

- `SOURCE_DATABASE_URL`
- `TARGET_DATABASE_URL`
- `SOURCE_S3_*`
- `TARGET_S3_*`

如果源数据库要求 TLS，保留：

```text
SOURCE_PG_SSL_MODE=require
SOURCE_PG_SSL_REJECT_UNAUTHORIZED=false
```

源数据库应使用 PostgreSQL 连接串，而不是 REST API URL 或匿名密钥。

## 5. 迁移 PostgreSQL（可选）

完整导出并清理后恢复到目标库：

```powershell
pnpm migrate:database -- --confirm-target pi_cube
```

安全机制：

- 恢复前必须提供与目标数据库名一致的 `--confirm-target`。
- 源和目标连接串相同时命令会拒绝执行。
- 未安装本机 PostgreSQL 工具时，脚本自动使用 Docker 中的 `postgres:16-alpine`。
- 备份保存在未跟踪的 `migration-artifacts/`。

仅导出：

```powershell
pnpm migrate:database -- --dump-only
```

仅恢复指定备份：

```powershell
pnpm migrate:database -- --restore-only --dump-file migration-artifacts/pi-cube.dump --confirm-target pi_cube
```

校验全部 `public` 表的行数：

```powershell
pnpm migrate:database:verify
```

报告生成于 `migration-artifacts/database-verification.json`。任何缺表或行数不一致都会返回非零退出码。

## 6. 迁移对象存储（可选）

先做只读演练：

```powershell
pnpm migrate:storage -- --dry-run
```

执行复制并按对象 key 和大小校验：

```powershell
pnpm migrate:storage -- --verify
```

已有同 key、同大小对象默认跳过。需要强制覆盖时增加 `--overwrite`。报告生成于 `migration-artifacts/storage-transfer.json`。

如需迁移指定前缀：

```powershell
pnpm migrate:storage -- --source-prefix old/path --target-prefix new/path --verify
```

## 7. 审计数据库文件引用

先审计所有文本、JSON 和 JSONB 字段中的旧存储 URL：

```powershell
pnpm migrate:storage:references
```

确认匹配范围后再写入：

```powershell
pnpm migrate:storage:references -- --apply --confirm-target pi_cube
```

注意：历史预签名 URL 的签名不能通过简单替换域名继续使用。数据库已有 `storage_key` 时，应保留 key，并由新环境动态生成签名 URL。只有稳定的公开 URL 前缀才适合批量重写。

## 8. 启动 Docker 完整应用

```powershell
docker compose --env-file .env.compose up -d --build
docker compose --env-file .env.compose ps
```

检查：

```powershell
Invoke-RestMethod http://localhost:4001/health
Invoke-WebRequest http://localhost:5000
Invoke-WebRequest http://localhost:8080/healthcheck
```

## 9. 业务验收

按顺序验证：

1. 登录和权限。
2. 客户、账套、工单和分润。
3. 企业入驻申请、审批、注册地址和注册号。
4. 合同模板上传、解析、编辑、导出和附件下载。
5. OnlyOffice 打开、保存、强制保存和回调。
6. 支付宝授权与回调。
7. 分享链接提交。
8. AI 文档识别与历史搜索网关。

## 10. 正式切换

1. 暂停旧系统写入。
2. 再执行一次数据库导出恢复和对象存储增量复制。
3. 再次运行数据库与存储校验。
4. 更新正式域名、TLS、CORS 和第三方回调地址。
5. 将流量切换到新环境。
6. 保留旧环境只读至少一个完整业务周期。

## 11. 回滚

- 切换前保留最后一次数据库 dump 和对象存储迁移报告。
- 不删除旧平台数据，先改为只读。
- 如新环境验收失败，将域名或代理流量切回旧环境。
- 新环境产生写入后，回滚前必须先决定这些增量数据的合并策略。
