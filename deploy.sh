#!/bin/bash

# Π立方会计系统 - 统一部署脚本
# 
# 核心原则：同一份代码，沙箱和生产环境自动适配
# 
# 使用方法:
#   ./deploy.sh sandbox   - 沙箱环境部署（自动启动前后端）
#   ./deploy.sh production - 生产环境部署
#   ./deploy.sh sync       - 同步代码到生产服务器

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 沙箱环境部署
deploy_sandbox() {
    log_step "开始沙箱环境部署..."
    
    # 检查依赖
    check_command node
    check_command pnpm
    
    # 设置环境变量
    export COZE_PROJECT_ENV=DEV
    export PG_PASSWORD="${PG_PASSWORD:-PiCube2024}"
    export ALIPAY_PRIVATE_KEY="${ALIPAY_PRIVATE_KEY:-}"
    export ALIPAY_PUBLIC_KEY="${ALIPAY_PUBLIC_KEY:-}"
    
    log_info "环境变量已设置: COZE_PROJECT_ENV=DEV"
    
    # 安装依赖
    log_step "安装依赖..."
    pnpm install
    
    # 构建前端
    log_step "构建前端..."
    pnpm run build
    
    # 停止旧的后端服务
    log_step "停止旧的后端服务..."
    pkill -f "node.*backend" 2>/dev/null || true
    
    # 启动后端服务（后台运行）
    log_step "启动后端服务..."
    cd backend
    COZE_PROJECT_ENV=DEV PG_PASSWORD="${PG_PASSWORD}" npx tsx src/index.ts > /app/work/logs/bypass/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    log_info "后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待后端启动
    sleep 3
    
    # 检查后端健康
    if curl -s http://localhost:4001/health > /dev/null; then
        log_info "后端服务健康检查通过"
    else
        log_warn "后端服务可能未正常启动，请检查日志"
    fi
    
    # 启动前端服务
    log_step "启动前端服务..."
    coze dev > /app/work/logs/bypass/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    log_info "前端服务已启动 (PID: $FRONTEND_PID)"
    
    echo ""
    log_info "沙箱环境部署完成！"
    echo ""
    echo "访问地址："
    echo "  前端: 使用 COZE_PROJECT_DOMAIN_DEFAULT 环境变量获取"
    echo "  后端: http://localhost:4001"
    echo ""
    echo "日志位置："
    echo "  前端: /app/work/logs/bypass/frontend.log"
    echo "  后端: /app/work/logs/bypass/backend.log"
}

# 生产环境部署
deploy_production() {
    log_step "开始生产环境部署..."
    
    # 检查依赖
    check_command node
    check_command pnpm
    check_command pm2
    
    # 设置环境变量
    export COZE_PROJECT_ENV=PROD
    export PG_PASSWORD="${PG_PASSWORD:-PiCube2024}"
    export ALIPAY_PRIVATE_KEY="${ALIPAY_PRIVATE_KEY:-}"
    export ALIPAY_PUBLIC_KEY="${ALIPAY_PUBLIC_KEY:-}"
    
    log_info "环境变量已设置: COZE_PROJECT_ENV=PROD"
    
    # 安装依赖
    log_step "安装依赖..."
    pnpm install
    
    # 构建前端
    log_step "构建前端..."
    pnpm run build
    
    # 构建后端
    log_step "构建后端..."
    cd backend
    pnpm install
    pnpm run build
    cd ..
    
    # 使用 PM2 管理服务
    log_step "使用 PM2 启动服务..."
    
    # 停止旧服务
    pm2 delete all 2>/dev/null || true
    
    # 使用 ecosystem.config.js 启动服务
    pm2 start ecosystem.config.js
    
    # 保存 PM2 配置
    pm2 save
    
    log_info "生产环境部署完成！"
    pm2 status
}

# 同步代码到生产服务器
sync_to_production() {
    log_step "同步代码到生产服务器..."
    
    # 生产服务器配置（需要配置 SSH 免密登录）
    PROD_SERVER="152.136.12.122"
    PROD_USER="root"
    PROD_DIR="/var/www/pi-cube"
    
    # 检查 SSH 连接
    log_info "检查 SSH 连接..."
    if ! ssh -o ConnectTimeout=5 ${PROD_USER}@${PROD_SERVER} "echo 'SSH OK'" 2>/dev/null; then
        log_error "无法连接到生产服务器 ${PROD_SERVER}，请检查 SSH 配置"
        exit 1
    fi
    
    # 同步代码
    log_info "同步代码..."
    rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
        ./ ${PROD_USER}@${PROD_SERVER}:${PROD_DIR}/
    
    # 在生产服务器上执行部署
    log_info "在生产服务器上执行部署..."
    ssh ${PROD_USER}@${PROD_SERVER} << 'EOF'
        cd /var/www/pi-cube
        chmod +x deploy.sh
        ./deploy.sh production
EOF
    
    log_info "代码同步完成！"
}

# 显示帮助
show_help() {
    echo "Π立方会计系统 - 统一部署脚本"
    echo ""
    echo "使用方法: $0 <command>"
    echo ""
    echo "命令:"
    echo "  sandbox     - 沙箱环境部署（自动启动前后端）"
    echo "  production  - 生产环境部署（使用 PM2 管理）"
    echo "  sync        - 同步代码到生产服务器并部署"
    echo "  help        - 显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  COZE_PROJECT_ENV    - 环境标识（DEV/PROD）"
    echo "  PG_PASSWORD         - 数据库密码"
    echo "  ALIPAY_PRIVATE_KEY  - 支付宝私钥"
    echo "  ALIPAY_PUBLIC_KEY   - 支付宝公钥"
    echo ""
    echo "示例:"
    echo "  # 沙箱环境部署"
    echo "  ./deploy.sh sandbox"
    echo ""
    echo "  # 生产环境部署"
    echo "  PG_PASSWORD=your_password ./deploy.sh production"
    echo ""
    echo "  # 同步到生产服务器"
    echo "  ./deploy.sh sync"
}

# 主函数
main() {
    case "$1" in
        sandbox)
            deploy_sandbox
            ;;
        production)
            deploy_production
            ;;
        sync)
            sync_to_production
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

main "$@"
