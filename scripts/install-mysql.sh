#!/bin/bash

# Π立方会计系统 - MySQL 安装脚本
# 用法: bash scripts/install-mysql.sh

set -e

echo "=========================================="
echo "Π立方会计系统 - MySQL 安装"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 数据库配置
DB_NAME="pi_cube"
DB_USER="pi_cube"
DB_PASSWORD=$(openssl rand -base64 12)

# 1. 安装 MySQL
echo ""
echo "📦 安装 MySQL..."
apt update
apt install mysql-server -y

# 2. 启动 MySQL
echo ""
echo "🚀 启动 MySQL 服务..."
systemctl start mysql
systemctl enable mysql

# 3. 创建数据库和用户
echo ""
echo "🔧 配置数据库..."
mysql -u root << EOF
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';

-- 授权
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;

-- 显示数据库
SHOW DATABASES;
EOF

# 4. 创建环境变量文件
echo ""
echo "📝 创建环境变量文件..."
cat > /var/www/pi-cube/.env.production << EOF
# MySQL 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASSWORD}
MYSQL_DATABASE=${DB_NAME}

# 支付宝配置（请填入实际值）
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_REDIRECT_URI=https://pi.chemicaloop.com/api/alipay/callback
EOF

echo ""
echo "=========================================="
echo "✅ MySQL 安装完成！"
echo ""
echo "📋 数据库信息:"
echo "   数据库名: ${DB_NAME}"
echo "   用户名: ${DB_USER}"
echo "   密码: ${DB_PASSWORD}"
echo ""
echo "📝 环境变量已保存到: /var/www/pi-cube/.env.production"
echo ""
echo "⚠️  请妥善保存密码！"
echo "=========================================="
