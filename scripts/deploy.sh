#!/bin/bash

# Π立方会计系统 - 一键部署脚本
# 使用方式: ./scripts/deploy.sh

set -e

echo "=========================================="
echo "  Π立方会计系统 - 生产环境部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 检查系统依赖
log_info "检查系统依赖..."
check_command node
check_command npm
check_command git

# 安装 pnpm（如未安装）
if ! command -v pnpm &> /dev/null; then
    log_info "安装 pnpm..."
    npm install -g pnpm
fi

# 安装 PM2（如未安装）
if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
fi

log_info "Node.js 版本: $(node -v)"
log_info "pnpm 版本: $(pnpm -v)"
log_info "PM2 版本: $(pm2 -v)"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

log_info "项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 安装前端依赖
log_info "安装前端依赖..."
pnpm install

# 构建前端
log_info "构建前端..."
pnpm run build

# 安装后端依赖
log_info "安装后端依赖..."
cd backend
pnpm install

# 构建后端
log_info "构建后端..."
pnpm run build
cd ..

# 停止旧服务（如果存在）
log_info "停止旧服务..."
pm2 delete pi-cube-web 2>/dev/null || true
pm2 delete pi-cube-api 2>/dev/null || true

# 启动后端 API
log_info "启动后端 API (端口 4001)..."
cd backend
pm2 start "pnpm start" --name "pi-cube-api"
cd ..

# 等待后端启动
sleep 3

# 启动前端
log_info "启动前端 (端口 4000)..."
pm2 start "pnpm start" --name "pi-cube-web"

# 保存 PM2 配置
log_info "保存 PM2 配置..."
pm2 save

# 显示服务状态
log_info "服务状态:"
pm2 list

echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  - 用户前端: http://localhost:4000"
echo "  - 后端 API: http://localhost:4001"
echo "  - API 文档: http://localhost:4001/api"
echo ""
echo "常用命令:"
echo "  - 查看状态: pm2 list"
echo "  - 查看日志: pm2 logs pi-cube-api"
echo "  - 重启服务: pm2 restart all"
echo ""
