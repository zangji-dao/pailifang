#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

# 自动判断端口
# 沙箱环境：使用平台设置的 DEPLOY_RUN_PORT (默认 5000)
# 生产环境：使用 PORT 环境变量 (默认 4000)
if [[ -n "${DEPLOY_RUN_PORT:-}" ]]; then
    # 沙箱环境，平台已设置
    PORT="${DEPLOY_RUN_PORT}"
    echo "检测到沙箱环境，使用端口: ${PORT}"
else
    # 生产环境
    PORT="${PORT:-4000}"
    echo "检测到生产环境，使用端口: ${PORT}"
fi

cd "${COZE_WORKSPACE_PATH}"

echo "Starting HTTP service on port ${PORT}..."
npx next start --port ${PORT}
