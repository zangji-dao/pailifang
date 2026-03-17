#!/bin/bash

# Π立方系统 - 一键部署脚本
# 用法: bash scripts/deploy-full.sh

set -e

PROJECT_DIR="/var/www/pi-cube"
DOMAIN="pi.chemicalloop.com"
PORT=5000

echo "=========================================="
echo "Π立方会计系统 - 一键部署"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd $PROJECT_DIR
mkdir -p logs

# 1. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main

# 2. 安装依赖
echo ""
echo "📦 安装依赖..."
pnpm install

# 3. 构建项目
echo ""
echo "🔨 构建项目..."
if pnpm run build; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 4. 配置 Nginx
echo ""
echo "🔧 配置 Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx 配置完成"

# 5. PM2 管理
echo ""
echo "🚀 启动服务..."

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    pnpm add -g pm2
fi

# 停止旧服务（如果存在）
pm2 delete pi-cube 2>/dev/null || true

# 启动新服务
pm2 start pnpm --name "pi-cube" -- run start
pm2 save

echo "✅ 服务已启动"

# 6. 验证
echo ""
echo "🔍 验证部署..."
sleep 3

if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
    echo "✅ 本地访问正常"
else
    echo "❌ 本地访问失败，检查日志..."
    pm2 logs pi-cube --lines 20
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo ""
echo "访问地址: http://$DOMAIN"
echo "PM2 管理: pm2 status"
echo "查看日志: pm2 logs pi-cube"
echo "=========================================="
