# 服务器端口规划表

**服务器 IP**: 152.136.12.122

## 端口分配总览

| 端口 | 项目 | 服务 | 说明 |
|------|------|------|------|
| 3000 | 项目A | 用户前端 | - |
| 3001 | 项目A | 管理前端 | - |
| 3002 | 项目A | 后端 API | - |
| **4000** | Π立方 | 用户前端 | Next.js |
| **4001** | Π立方 | 后端 API | Express |
| **4002** | Π立方 | 管理后台 | Next.js |
| 5000 | - | 保留 | 避免占用 |
| 5432 | 系统 | PostgreSQL | 数据库 |
| 80 | Nginx | HTTP | 反向代理 |
| 443 | Nginx | HTTPS | 反向代理 |

## Π立方系统详细规划

### 服务架构（BFF 模式）

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (80/443)                      │
│                                                         │
│   pi.chemicaloop.com ──────► Π立方前端 (4000)           │
│   api.pi.chemicaloop.com ──► Π立方后端 (4001)           │
│   admin.pi.chemicaloop.com ► Π立方管理后台 (4002)       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   PostgreSQL (5432)     │
              │   数据库共用            │
              └─────────────────────────┘
```

### 启动命令

```bash
# 后端 API
cd /var/www/pi-cube/server
pm2 start "pnpm start" --name "pi-cube-api"

# 用户前端
cd /var/www/pi-cube
pm2 start "pnpm start" --name "pi-cube-web"

# 管理后台
cd /var/www/pi-cube/admin-console
pm2 start "pnpm start" --name "pi-cube-admin"
```

### 环境变量配置

**后端 API (.env)**
```
PORT=4001
DATABASE_HOST=152.136.12.122
DATABASE_PORT=5432
DATABASE_USER=pi_user
DATABASE_PASSWORD=PiCube2024
DATABASE_NAME=pi_cube
```

**前端 (.env.local)**
```
NEXT_PUBLIC_API_URL=http://152.136.12.122:4001
# 或使用域名
NEXT_PUBLIC_API_URL=https://api.pi.chemicaloop.com
```

## 项目A 详细规划（请补充）

| 端口 | 服务 | 域名 | 说明 |
|------|------|------|------|
| 3000 | 用户前端 | ? | |
| 3001 | 管理前端 | ? | |
| 3002 | 后端 API | ? | |

## 域名规划

| 域名 | 指向 | 端口 |
|------|------|------|
| pi.chemicaloop.com | Π立方用户前端 | 4000 |
| api.pi.chemicaloop.com | Π立方后端API | 4001 |
| admin.pi.chemicaloop.com | Π立方管理后台 | 4002 |
| ? | 项目A用户前端 | 3000 |
| ? | 项目A管理前端 | 3001 |
| ? | 项目A后端API | 3002 |

## 注意事项

1. **端口冲突检查**
   ```bash
   # 查看已占用端口
   netstat -tlnp | grep -E '300[0-2]|400[0-2]|5000'
   ```

2. **防火墙配置**
   ```bash
   # 开放端口
   ufw allow 4000
   ufw allow 4001
   ufw allow 4002
   ```

3. **PM2 管理**
   ```bash
   # 查看所有服务
   pm2 list
   
   # 保存配置
   pm2 save
   ```
