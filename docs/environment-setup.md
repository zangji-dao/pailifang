# 环境配置

## 环境划分

项目使用标准 `NODE_ENV`：

- `development`：本地开发
- `production`：生产部署

运行环境不再通过平台域名或平台专用变量判断。

## 本地环境

```powershell
Copy-Item .env.example .env.local
Copy-Item backend/.env.example backend/.env
pnpm install
pnpm dev
```

默认端口：

| 服务 | 端口 |
| --- | --- |
| Next.js | 5000 |
| Express | 4001 |
| OnlyOffice | 8080 |
| PostgreSQL | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## 必需配置

- `APP_URL`
- `BACKEND_URL`
- `DATABASE_URL`
- `CORS_ORIGINS`

按功能配置：

- PostgreSQL TLS：`PG_SSL_MODE`、`PG_SSL_REJECT_UNAUTHORIZED`
- 对象存储：`S3_BUCKET`、`S3_REGION`、凭据、`S3_ENDPOINT`
- 浏览器可访问的对象存储端点：`S3_PUBLIC_ENDPOINT`
- AI：`AI_BASE_URL`、`AI_API_KEY`、模型名称
- OnlyOffice、支付宝、萤石云对应变量

`S3_ENDPOINT` 用于容器内读写，`S3_PUBLIC_ENDPOINT` 用于生成浏览器可访问的签名链接。在单机 Docker Compose 中通常分别为 `http://minio:9000` 和 `http://localhost:9000`。

`ALLOW_DATABASE_MIGRATION_API` 默认必须为 `false`。只有执行受控的旧版迁移接口时才能临时启用，并应在完成后立即关闭。

所有真实密钥只应保存在本地未跟踪文件或部署平台密钥管理中。
