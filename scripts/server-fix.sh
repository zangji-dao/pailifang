#!/bin/bash

# Π立方系统 - 自动修复脚本
# 用法: bash scripts/server-fix.sh

PROJECT_DIR="/var/www/pi-cube"
PORT=5000

echo "=========================================="
echo "Π立方会计系统 - 自动修复"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd $PROJECT_DIR

# 诊断函数
diagnose() {
    echo ""
    echo "🔍 诊断: $1"
}

# 修复函数
fix() {
    echo "🔧 修复: $1"
}

# 1. 检查服务是否运行
diagnose "检查 PM2 服务"
if pm2 status | grep -q "pi-cube.*online"; then
    echo "✅ PM2 服务运行中"
else
    fix "重启 PM2 服务"
    pm2 restart pi-cube 2>/dev/null || pm2 start pnpm --name "pi-cube" -- run start
    sleep 3
fi

# 2. 检查端口监听
diagnose "检查端口监听"
if ss -tln | grep -q ":$PORT "; then
    echo "✅ 端口 $PORT 正在监听"
else
    fix "服务未监听端口，重启服务"
    pm2 restart pi-cube
    sleep 5
    
    # 再次检查
    if ss -tln | grep -q ":$PORT "; then
        echo "✅ 端口监听已恢复"
    else
        echo "❌ 端口监听失败，查看日志:"
        pm2 logs pi-cube --lines 30
        exit 1
    fi
fi

# 3. 检查本地访问
diagnose "检查本地访问"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地访问正常 (HTTP $HTTP_CODE)"
else
    fix "本地访问异常 (HTTP $HTTP_CODE)"
    echo "查看最近日志:"
    pm2 logs pi-cube --lines 20
fi

# 4. 检查 Nginx
diagnose "检查 Nginx"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx 运行中"
else
    fix "启动 Nginx"
    systemctl start nginx
fi

# 5. 检查 Nginx 配置
diagnose "检查 Nginx 配置"
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx 配置正确"
else
    fix "Nginx 配置错误"
    nginx -t
fi

# 6. 检查站点配置
diagnose "检查站点配置"
if [ -L "/etc/nginx/sites-enabled/pi.chemicalloop.com" ]; then
    echo "✅ 站点配置已启用"
else
    fix "启用站点配置"
    ln -sf /etc/nginx/sites-available/pi.chemicalloop.com /etc/nginx/sites-enabled/
    systemctl reload nginx
fi

# 7. 最终测试
echo ""
echo "=========================================="
echo "📊 最终状态"
echo "=========================================="

echo ""
echo "PM2 状态:"
pm2 status

echo ""
echo "端口监听:"
ss -tln | grep -E ":(3000|5000)\s" || echo "无端口监听"

echo ""
echo "本地访问测试:"
curl -I http://localhost:$PORT 2>&1 | head -5

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
