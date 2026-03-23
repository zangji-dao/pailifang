#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
# 使用 --ignore-scripts 跳过 puppeteer 等包的 postinstall 脚本
pnpm install --ignore-scripts 2>/dev/null || pnpm install --ignore-scripts
