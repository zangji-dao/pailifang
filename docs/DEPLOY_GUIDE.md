# 部署指南

## 服务器准备

安装 Node.js、pnpm、PostgreSQL 客户端和可选的 PM2。生产环境应使用 TLS 反向代理，并只开放必要端口。

## 环境变量

将 `.env.production.example` 中的变量配置到部署平台，不要把真实值写入仓库。

至少配置：

- `NODE_ENV=production`
- `APP_URL=https://your-domain.example`
- `BACKEND_URL=http://127.0.0.1:4001`
- `DATABASE_URL`
- `CORS_ORIGINS=https://your-domain.example`

其他变量按实际启用的外部服务配置。

## 构建

```bash
./deploy.sh build
```

等价命令：

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm build
```

## PM2

```bash
./deploy.sh pm2
pm2 status
```

`ecosystem.config.js` 使用项目当前目录，不绑定固定服务器路径或 IP。

## 反向代理

建议把公开域名代理到 Next.js 的 `5000` 端口，并由 Next.js BFF 路由访问本机 `4001` 端口。Express 端口不应直接暴露到公网。

## 数据迁移

```bash
pg_dump "$SOURCE_DATABASE_URL" > pi_cube.sql
psql "$DATABASE_URL" < pi_cube.sql
```

数据库迁移前必须先做备份，并在隔离环境验证 schema 与业务数据。
