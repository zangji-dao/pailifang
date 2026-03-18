# Π立方会计系统 - 生产部署指南

## 服务器要求
- Node.js 20+ / Node.js 24 (推荐)
- PostgreSQL 14+
- Nginx
- PM2 (全局安装)

## 环境变量配置

在服务器上创建 `.env.production` 文件：

```bash
# PostgreSQL 数据库配置
DATABASE_HOST=152.136.12.122
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=pi_accounting

# 应用配置
NODE_ENV=production
PORT=5000
```

## 部署步骤

### 1. 安装依赖

```bash
# 安装 PM2（如未安装）
npm install -g pm2

# 安装 pnpm（如未安装）
npm install -g pnpm
```

### 2. 克隆代码

```bash
# 克隆代码到服务器
cd /var/www
git clone <your-repo-url> pi-accounting
cd pi-accounting
```

### 3. 安装项目依赖

```bash
pnpm install
```

### 4. 构建生产版本

```bash
pnpm run build
```

### 5. 启动服务

```bash
# 使用 PM2 启动
pm2 start pnpm --name "pi-accounting" -- run start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 6. Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/pi.chemicaloop.com`：

```nginx
server {
    listen 80;
    server_name pi.chemicaloop.com;

    # 重定向到 HTTPS（推荐）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pi.chemicaloop.com;

    # SSL 证书配置（使用 Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/pi.chemicaloop.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pi.chemicaloop.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:5000;
        proxy_cache static_cache;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/pi.chemicaloop.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload
```

### 7. SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d pi.chemicaloop.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 8. 初始化数据

```bash
# 调用初始化接口
curl -X POST https://pi.chemicaloop.com/api/init-data
```

## 更新部署

```bash
cd /var/www/pi-accounting

# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 重新构建
pnpm run build

# 重启服务
pm2 restart pi-accounting
```

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs pi-accounting

# 重启服务
pm2 restart pi-accounting

# 停止服务
pm2 stop pi-accounting

# 删除服务
pm2 delete pi-accounting
```

## 数据库备份

```bash
# 备份数据库
pg_dump -h 152.136.12.122 -U postgres pi_accounting > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -h 152.136.12.122 -U postgres pi_accounting < backup_20240318.sql
```

## 监控与告警

建议安装 PM2 的监控模块：

```bash
pm2 install pm2-logrotate
```

配置日志轮转，避免日志文件过大。
