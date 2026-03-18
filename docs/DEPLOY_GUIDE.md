# Π立方会计系统 - 生产部署指南

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (80/443)                      │
│                                                         │
│   pi.chemicaloop.com ──────► 用户前端 (4000)            │
│   api.pi.chemicaloop.com ──► 后端 API (4001)            │
│   admin.pi.chemicaloop.com ► 管理后台 (4002)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   PostgreSQL (5432)     │
              │   152.136.12.122        │
              └─────────────────────────┘
```

## 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | 152.136.12.122 |
| 部署目录 | `/var/www/pi-cube` |
| 数据库 | PostgreSQL 14 @ 5432 |
| Node.js | 24.x |
| 包管理器 | pnpm |

## 一键部署

### 方式一：SSH 克隆部署（推荐）

```bash
# SSH 登录服务器
ssh root@152.136.12.122

# 创建目录
mkdir -p /var/www/pi-cube && cd /var/www/pi-cube

# 克隆代码（SSH 方式，需要先配置 GitHub SSH Key）
git clone git@github.com:zangji-dao/pailifang.git .

# 执行部署脚本
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

### 方式二：HTTPS 克隆部署

```bash
# SSH 登录服务器
ssh root@152.136.12.122

# 创建目录
mkdir -p /var/www/pi-cube && cd /var/www/pi-cube

# 克隆代码
git clone https://github.com/zangji-dao/pailifang.git .

# 执行部署脚本
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

## 手动部署步骤

### 1. 安装系统依赖

```bash
# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

### 2. 克隆代码

```bash
cd /var/www
git clone https://github.com/zangji-dao/pailifang.git pi-cube
cd pi-cube
```

### 3. 配置环境变量

**后端环境变量** `backend/.env`:
```bash
# 数据库
PG_HOST=152.136.12.122
PG_PORT=5432
PG_USER=pi_user
PG_PASSWORD=PiCube2024
PG_DATABASE=pi_cube

# 服务端口
PORT=4001

# 对象存储（Lighthouse）
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=pi-cube-files
S3_REGION=ap-beijing
S3_ENDPOINT=https://cos.ap-beijing.myqcloud.com

# 支付宝
ALIPAY_APPID=your_appid
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_REDIRECT_URI=https://pi.chemicaloop.com/api/alipay/callback
```

**前端环境变量** `.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://api.pi.chemicaloop.com
```

### 4. 安装依赖并构建

```bash
# 前端
pnpm install
pnpm run build

# 后端
cd backend
pnpm install
pnpm run build
cd ..
```

### 5. 启动服务

```bash
# 启动后端 API (4001)
cd backend
pm2 start "pnpm start" --name "pi-cube-api"
cd ..

# 启动前端 (4000)
pm2 start "pnpm start" --name "pi-cube-web"

# 保存 PM2 配置
pm2 save
pm2 startup
```

## Nginx 配置

### 创建配置文件

```bash
sudo nano /etc/nginx/sites-available/pi.chemicaloop.com
```

```nginx
# 用户前端
server {
    listen 80;
    server_name pi.chemicaloop.com;
    
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 后端 API
server {
    listen 80;
    server_name api.pi.chemicaloop.com;
    
    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 管理后台（待部署）
server {
    listen 80;
    server_name admin.pi.chemicaloop.com;
    
    location / {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/pi.chemicaloop.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### SSL 证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d pi.chemicaloop.com -d api.pi.chemicaloop.com -d admin.pi.chemicaloop.com

# 自动续期
sudo certbot renew --dry-run
```

## 更新部署

```bash
cd /var/www/pi-cube

# 拉取代码
git pull origin main

# 更新前端
pnpm install
pnpm run build

# 更新后端
cd backend
pnpm install
pnpm run build
cd ..

# 重启服务
pm2 restart all
```

## 常用命令

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs pi-cube-api
pm2 logs pi-cube-web

# 重启服务
pm2 restart pi-cube-api
pm2 restart pi-cube-web

# 查看端口占用
netstat -tlnp | grep -E '400[0-2]'

# 查看 Nginx 状态
sudo systemctl status nginx
```

## 端口规划

| 端口 | 服务 | 说明 |
|------|------|------|
| 4000 | 用户前端 | Next.js |
| 4001 | 后端 API | Express |
| 4002 | 管理后台 | Next.js |
| 5432 | PostgreSQL | 数据库 |
| 80/443 | Nginx | 反向代理 |

## 故障排查

### 服务无法启动

```bash
# 检查端口占用
lsof -i :4000
lsof -i :4001

# 检查日志
pm2 logs --lines 100
```

### 数据库连接失败

```bash
# 测试数据库连接
psql -h 152.136.12.122 -U pi_user -d pi_cube

# 检查防火墙
sudo ufw status
```

### Nginx 502 错误

```bash
# 检查后端服务是否运行
pm2 list

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```
