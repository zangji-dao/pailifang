# 生产环境部署指南

## 敏感信息配置

敏感信息（密码、密钥等）不存储在 Git 仓库中，需要在生产服务器上单独配置。

### 步骤 1：创建环境变量文件

在生产服务器上创建 `/var/www/pi-cube/.env.production`：

```bash
cd /var/www/pi-cube
cat > .env.production << 'EOF'
# 数据库密码
PG_PASSWORD=你的数据库密码

# 支付宝私钥
ALIPAY_PRIVATE_KEY=你的支付宝私钥

# 支付宝公钥
ALIPAY_PUBLIC_KEY=你的支付宝公钥
EOF
```

### 步骤 2：部署服务

```bash
# 拉取最新代码
git pull origin main

# 加载环境变量并部署
source .env.production && export PG_PASSWORD ALIPAY_PRIVATE_KEY ALIPAY_PUBLIC_KEY
./deploy.sh production
```

### 或者：直接通过环境变量启动

```bash
PG_PASSWORD="xxx" ALIPAY_PRIVATE_KEY="xxx" ALIPAY_PUBLIC_KEY="xxx" pm2 start ecosystem.config.js
pm2 save
```

## 文件说明

| 文件 | 是否提交 Git | 说明 |
|------|-------------|------|
| `.env.example` | ✅ 提交 | 模板文件，不含真实值 |
| `.env.production.example` | ✅ 提交 | 模板文件，不含真实值 |
| `.env.local` | ❌ 不提交 | 本地开发配置 |
| `.env.production` | ❌ 不提交 | 生产环境配置，含真实密钥 |

## PM2 配置

`ecosystem.config.js` 不包含敏感信息，通过环境变量传入：

```bash
# 启动命令
PG_PASSWORD="xxx" pm2 start ecosystem.config.js

# 或使用 .env 文件
set -a && source .env.production && set +a && pm2 start ecosystem.config.js
```
