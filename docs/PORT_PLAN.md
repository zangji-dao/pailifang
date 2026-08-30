# 端口规划

| 服务 | 默认端口 | 暴露范围 |
| --- | ---: | --- |
| Next.js | 5000 | 通过反向代理公开 |
| Express API | 4001 | 仅本机或内网 |
| PostgreSQL | 5432 | 仅数据库网络 |
| OnlyOffice | 8080 | 仅受控网络或独立 HTTPS 域名 |

生产环境不要在源码中写服务器 IP。域名、端口和来源白名单应通过 `APP_URL`、`BACKEND_URL`、`CORS_ORIGINS` 等环境变量配置。
