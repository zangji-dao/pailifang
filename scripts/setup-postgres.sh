#!/bin/bash

# ============================================
# Π立方系统 - PostgreSQL 数据库配置脚本
# 自动创建数据库、用户、配置远程访问
# ============================================

set -e

# 配置变量
DB_NAME="pi_cube"
DB_USER="pi_user"
DB_PASSWORD="PiCube2024!"
PG_VERSION="14"

echo "============================================"
echo "  Π立方系统 - PostgreSQL 数据库配置"
echo "============================================"
echo ""

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL 未安装，正在安装..."
    
    # 添加 PostgreSQL 官方源
    sudo sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
    
    # 导入密钥
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    
    # 安装
    sudo apt update
    sudo apt install postgresql-${PG_VERSION} -y
    
    # 启动服务
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo "✅ PostgreSQL ${PG_VERSION} 安装完成"
fi

echo ""
echo "📦 创建数据库和用户..."

# 创建数据库和用户
sudo -u postgres psql << EOF
-- 创建数据库
CREATE DATABASE ${DB_NAME};

-- 创建用户
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- 切换数据库并授权 schema
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};

-- 创建扩展（可选）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

echo "✅ 数据库和用户创建完成"

echo ""
echo "🔧 配置远程访问..."

# 配置 pg_hba.conf（允许远程连接）
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
if ! grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA"; then
    echo "host all all 0.0.0.0/0 md5" | sudo tee -a "$PG_HBA"
    echo "✅ 已配置 pg_hba.conf"
fi

# 配置 postgresql.conf（监听所有 IP）
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
echo "✅ 已配置 postgresql.conf"

# 重启 PostgreSQL
echo ""
echo "🔄 重启 PostgreSQL 服务..."
sudo systemctl restart postgresql
echo "✅ 服务已重启"

# 检查端口
echo ""
echo "🔍 检查端口监听..."
if ss -tlnp | grep -q ":5432"; then
    echo "✅ 端口 5432 正在监听"
else
    echo "⚠️  端口 5432 未监听，请检查配置"
fi

# 配置防火墙
echo ""
echo "🔥 配置防火墙..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 5432/tcp
    echo "✅ 已开放 5432 端口"
else
    echo "⚠️  ufw 未安装，请手动开放 5432 端口"
fi

# 完成
echo ""
echo "============================================"
echo "  ✅ PostgreSQL 配置完成！"
echo "============================================"
echo ""
echo "连接信息："
echo "  Host:     $(curl -s ifconfig.me 2>/dev/null || echo '您的服务器IP')"
echo "  Port:     5432"
echo "  Database: ${DB_NAME}"
echo "  User:     ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "请在云服务商控制台开放 5432 端口安全组！"
echo "============================================"
