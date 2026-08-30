# Coze 项目迁移记录

> 执行日期：2026-08-23

## 导入来源

- 归档：`project_20260824_010415.tar.gz`
- 说明：归档文件名标记为 2026-08-24，比执行日期 2026-08-23 晚一天，可能来自导出环境时区或系统时钟差异。
- 最终项目目录：`C:\Users\hy\Documents\ChatGPT\PI立方企业服务中心`
- 安全处理：未导入 `assets/ngrok_recovery_codes.txt`。

## 已完成

- 将源码完整导入独立 Git 工作区，并保留目标仓库的 `.git`。
- 删除 `.coze`、Coze 启动脚本、开发检查器和 `coze-coding-dev-sdk`。
- 删除 workload identity 的 Python 环境变量注入。
- 将 Next.js 路由从 Supabase REST SDK 切换为直接 PostgreSQL 参数化查询兼容层。
- 数据库配置统一为 `DATABASE_URL`、`PG_*` 和 TLS 变量。
- 对象存储改为标准 AWS SDK S3 适配器，支持内网读写端点和公网签名端点。
- OCR 和合同结构分析改为 OpenAI-compatible API。
- 历史检索脚本改为可配置 HTTP 搜索网关。
- 移除代码中的默认数据库密码、固定服务器地址和第三方密钥回退。
- 增加 PostgreSQL 导出/恢复、行数校验、S3 对象复制和 URL 引用重写工具。
- 增加 PostgreSQL、MinIO、OnlyOffice、Next.js 和 Express 的 Docker Compose 部署。
- 开发、构建和启动命令统一为跨平台 `pnpm` 命令。

## 外部数据状态

源码归档不包含以下受控资源，因此无法仅凭归档完成实际数据复制：

- 原 PostgreSQL 数据库连接串或数据库备份。
- 原对象存储桶读取凭据或完整对象备份。
- 支付宝、OnlyOffice、萤石云、地图和 AI 服务的生产密钥。
- 正式域名、TLS 证书和反向代理配置。

收到源数据库和源存储桶只读权限后，按 `docs/FULL_MIGRATION_RUNBOOK_2026-08-23.md` 执行即可完成数据切换。

## 安全处置

源归档曾包含恢复码文件、数据库默认密码和第三方服务密钥回退。虽然目标目录已清理，仍应轮换相关数据库密码、第三方密钥和恢复码，并妥善销毁或加密保存原归档。

## 上线前检查

1. 执行 `pnpm install`。
2. 执行 `pnpm ts-check`、`pnpm build:web`、`pnpm build:backend`。
3. 导入数据库并执行源/目标表行数校验。
4. 复制对象存储并校验对象 key 与大小。
5. 审计并按需重写数据库中的旧存储 URL。
6. 验证登录、权限、企业入驻、合同、附件、支付、OnlyOffice 和分享链接。
