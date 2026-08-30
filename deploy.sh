#!/usr/bin/env bash
set -Eeuo pipefail

command_name="${1:-build}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1" >&2
    exit 1
  fi
}

install_dependencies() {
  require_command pnpm
  pnpm install --frozen-lockfile
  pnpm --dir backend install --frozen-lockfile
}

build_project() {
  install_dependencies
  pnpm build
}

case "$command_name" in
  install)
    install_dependencies
    ;;
  build)
    build_project
    ;;
  start)
    require_command pnpm
    exec pnpm start
    ;;
  pm2)
    require_command pm2
    build_project
    pm2 startOrReload ecosystem.config.js
    pm2 save
    ;;
  *)
    echo "用法: $0 {install|build|start|pm2}" >&2
    exit 1
    ;;
esac
