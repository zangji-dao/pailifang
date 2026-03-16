#!/bin/bash

# Π立方项目构建脚本 - 带日志上传
# 用法: ./scripts/build-and-log.sh

PROJECT_DIR="/var/www/pi-cube"
LOG_FILE="$PROJECT_DIR/logs/build.log"
ERROR_LOG_FILE="$PROJECT_DIR/logs/build-error.log"

echo "=========================================="
echo "Π立方会计系统 - 构建脚本"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 进入项目目录
cd $PROJECT_DIR

# 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main

# 创建日志目录
mkdir -p logs

# 执行构建并记录日志（使用 set -o pipefail 正确捕获错误）
echo ""
echo "🔨 开始构建..."
echo "构建时间: $(date '+%Y-%m-%d %H:%M:%S')" > $LOG_FILE
echo "==========================================" >> $LOG_FILE

set -o pipefail
if pnpm run build 2>&1 | tee -a $LOG_FILE; then
    set +o pipefail
    # 构建成功
    echo "" >> $LOG_FILE
    echo "==========================================" >> $LOG_FILE
    echo "✅ 构建成功: $(date '+%Y-%m-%d %H:%M:%S')" >> $LOG_FILE
    
    # 提交日志到 GitHub
    git add -f logs/build.log
    git commit -m "chore: 更新构建日志 - 成功" || echo "无日志变更"
    git push origin main || echo "日志推送失败（可忽略）"
    
    echo ""
    echo "✅ 构建成功！"
    echo "📋 日志已保存: logs/build.log"
else
    set +o pipefail
    # 构建失败
    echo "" >> $LOG_FILE
    echo "==========================================" >> $LOG_FILE
    echo "❌ 构建失败: $(date '+%Y-%m-%d %H:%M:%S')" >> $LOG_FILE
    
    # 保存错误日志
    cp $LOG_FILE $ERROR_LOG_FILE
    
    # 提交日志到 GitHub
    git add -f logs/build.log logs/build-error.log
    git commit -m "chore: 更新构建日志 - 失败" || echo "无日志变更"
    git push origin main || echo "日志推送失败（可忽略）"
    
    echo ""
    echo "❌ 构建失败！"
    echo "📋 错误日志: logs/build-error.log"
    exit 1
fi
