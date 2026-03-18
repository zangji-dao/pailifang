#!/bin/bash

# Π立方会计系统 - 自动部署脚本
# 使用方法: ./deploy.sh [update|init|restart|logs]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
APP_NAME="pi-accounting"
APP_DIR="/var/www/pi-accounting"
REPO_URL="" # 填入你的 Git 仓库地址

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

# 初始部署
deploy_init() {
    log_info "开始初始部署..."
    
    # 检查依赖
    check_command node
    check_command pnpm
    check_command pm2
    
    # 检查目录是否存在
    if [ -d "$APP_DIR" ]; then
        log_warn "目录 $APP_DIR 已存在，请使用 ./deploy.sh update 更新"
        exit 1
    fi
    
    # 克隆代码
    log_info "克隆代码..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
    
    # 安装依赖
    log_info "安装依赖..."
    pnpm install
    
    # 构建
    log_info "构建项目..."
    pnpm run build
    
    # 启动服务
    log_info "启动服务..."
    pm2 start pnpm --name $APP_NAME -- run start
    
    # 保存 PM2 配置
    pm2 save
    
    log_info "部署完成！请配置 Nginx 和 SSL 证书"
}

# 更新部署
deploy_update() {
    log_info "开始更新部署..."
    
    cd $APP_DIR
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin main
    
    # 安装依赖
    log_info "安装依赖..."
    pnpm install
    
    # 构建
    log_info "构建项目..."
    pnpm run build
    
    # 重启服务
    log_info "重启服务..."
    pm2 restart $APP_NAME
    
    log_info "更新完成！"
}

# 重启服务
deploy_restart() {
    log_info "重启服务..."
    pm2 restart $APP_NAME
    log_info "重启完成！"
}

# 查看日志
deploy_logs() {
    pm2 logs $APP_NAME
}

# 主函数
main() {
    case "$1" in
        init)
            deploy_init
            ;;
        update)
            deploy_update
            ;;
        restart)
            deploy_restart
            ;;
        logs)
            deploy_logs
            ;;
        *)
            echo "使用方法: $0 {init|update|restart|logs}"
            echo ""
            echo "  init   - 初始部署"
            echo "  update - 更新部署"
            echo "  restart - 重启服务"
            echo "  logs   - 查看日志"
            exit 1
            ;;
    esac
}

main "$@"
