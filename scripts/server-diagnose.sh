#!/bin/bash

# Π立方系统 - 服务器诊断脚本
# 用法: bash scripts/server-diagnose.sh

PROJECT_DIR="/var/www/pi-cube"
LOG_FILE="$PROJECT_DIR/logs/diagnose.log"

echo "=========================================="
echo "Π立方会计系统 - 服务器诊断"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd $PROJECT_DIR
mkdir -p logs

# 记录日志函数
log() {
    echo "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# 1. 检查 PM2 状态
log ""
log "=== 1. PM2 服务状态 ==="
pm2 status >> $LOG_FILE 2>&1

# 2. 检查端口监听
log ""
log "=== 2. 端口监听状态 ==="
ss -tlnp | grep -E ':(3000|5000)\s' >> $LOG_FILE 2>&1 || log "没有服务监听 3000 或 5000 端口"

# 3. 检查本地访问
log ""
log "=== 3. 本地访问测试 ==="
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200"; then
    log "✅ 本地 5000 端口访问正常"
else
    log "❌ 本地 5000 端口访问失败"
    log "尝试重启服务..."
    pm2 restart pi-cube >> $LOG_FILE 2>&1
    sleep 5
fi

# 4. 检查 Nginx 状态
log ""
log "=== 4. Nginx 状态 ==="
systemctl status nginx --no-pager >> $LOG_FILE 2>&1

# 5. 检查 Nginx 配置
log ""
log "=== 5. Nginx 配置 ==="
if [ -f "/etc/nginx/sites-enabled/pi.chemicalloop.com" ]; then
    log "✅ Nginx 站点配置已启用"
    cat /etc/nginx/sites-enabled/pi.chemicalloop.com >> $LOG_FILE 2>&1
else
    log "❌ Nginx 站点配置未找到"
fi

# 6. DNS 解析检查
log ""
log "=== 6. DNS 解析检查 ==="
nslookup pi.chemicalloop.com >> $LOG_FILE 2>&1 || log "DNS 解析失败"

# 7. 最新错误日志
log ""
log "=== 7. 最新错误日志 (最后 30 行) ==="
pm2 logs pi-cube --lines 30 --nostream >> $LOG_FILE 2>&1

# 8. 系统资源
log ""
log "=== 8. 系统资源 ==="
df -h / >> $LOG_FILE 2>&1
free -h >> $LOG_FILE 2>&1

log ""
log "=========================================="
log "诊断完成，日志保存到: $LOG_FILE"
log "=========================================="

# 推送日志到 GitHub
git add -f logs/diagnose.log
git commit -m "chore: 更新诊断日志" || echo "无变更"
git push origin main || echo "推送失败"

echo ""
echo "✅ 诊断完成！"
echo "📋 日志已推送到 GitHub: logs/diagnose.log"
