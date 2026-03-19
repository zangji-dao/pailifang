#!/bin/bash
set -Eeuo pipefail

# 沙箱环境开发启动脚本
# 沙箱与生产完全一致：使用同一个数据库 pi_cube

PORT=5000
BACKEND_PORT=4001
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
NODE_ENV=development
DEPLOY_RUN_PORT=5000

cd "${COZE_WORKSPACE_PATH}"

# 设置环境变量
export COZE_PROJECT_ENV=DEV
export PG_PASSWORD="${PG_PASSWORD:-PiCube2024}"

echo "=============================================="
echo "  Π立方会计系统 - 沙箱环境启动"
echo "=============================================="
echo "环境: DEV (沙箱)"
echo "模式: 完全一致（与生产共用数据库）"
echo "数据库: pi_cube"
echo "前端端口: ${PORT}"
echo "后端端口: ${BACKEND_PORT}"
echo "=============================================="

kill_port_if_listening() {
    local port=$1
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -z "${pids}" ]]; then
      echo "Port ${port} is free."
      return
    fi
    echo "Port ${port} in use by PIDs: ${pids} (SIGKILL)"
    echo "${pids}" | xargs -I {} kill -9 {}
    sleep 1
}

# 清理端口
echo "Clearing ports before start..."
kill_port_if_listening ${PORT}
kill_port_if_listening ${BACKEND_PORT}

# 启动后端服务
echo "Starting backend service on port ${BACKEND_PORT}..."
cd "${COZE_WORKSPACE_PATH}/backend"

# 检查后端依赖是否安装
if [[ ! -d "node_modules" ]]; then
    echo "Installing backend dependencies..."
    pnpm install 2>/dev/null || npm install 2>/dev/null || true
fi

# 后台启动后端
COZE_PROJECT_ENV=DEV PG_PASSWORD="${PG_PASSWORD}" npx tsx src/index.ts > /app/work/logs/bypass/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: ${BACKEND_PID}"

# 等待后端启动
echo "Waiting for backend to start..."
sleep 3

# 检查后端健康
if curl -s http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "⚠️ Backend health check failed, check logs: /app/work/logs/bypass/backend.log"
fi

# 返回项目根目录
cd "${COZE_WORKSPACE_PATH}"

# 启动前端服务
echo "Starting frontend service on port ${PORT}..."
echo ""
echo "=============================================="
echo "  沙箱环境已就绪"
echo "=============================================="
echo "数据库: pi_cube（与生产共用）"
echo ""
echo "访问地址:"
echo "  前端: 使用 COZE_PROJECT_DOMAIN_DEFAULT 环境变量获取"
echo "  后端: http://localhost:${BACKEND_PORT}"
echo ""
echo "日志位置:"
echo "  前端: 控制台输出"
echo "  后端: /app/work/logs/bypass/backend.log"
echo "=============================================="
echo ""

# 前台启动前端（这是主进程）
npx next dev --webpack --port $PORT
