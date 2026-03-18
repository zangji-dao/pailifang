#!/bin/bash

# Π立方会计系统 - 对象存储测试脚本
# 结果写入日志文件: /var/log/pi-cube/storage-test.log

# 日志文件
LOG_DIR="/var/log/pi-cube"
LOG_FILE="${LOG_DIR}/storage-test.log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 清空日志
echo "" > "$LOG_FILE"

log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "  对象存储服务测试"
log "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "=========================================="
log ""

# API 地址
API_URL="http://localhost:4001"

# 测试文件
TEST_FILE="/tmp/pi-cube-test-${RANDOM}.txt"

# 创建测试文件
echo "这是一个测试文件，用于验证对象存储功能。" > "$TEST_FILE"
echo "创建时间: $(date)" >> "$TEST_FILE"

log "📋 测试文件: $TEST_FILE"
log ""

# 测试 1: 健康检查
log "[1/5] 测试健康检查..."
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    log "✅ 服务正常"
else
    log "❌ 服务异常"
    log "$HEALTH"
    exit 1
fi
log ""

# 测试 2: 上传文件
log "[2/5] 测试上传文件..."
UPLOAD_RESULT=$(curl -s -X POST "${API_URL}/api/storage/upload" \
    -F "file=@${TEST_FILE}" \
    -F "type=document")

if echo "$UPLOAD_RESULT" | grep -q '"success":true'; then
    log "✅ 上传成功"
    FILE_KEY=$(echo "$UPLOAD_RESULT" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
    log "   文件路径: $FILE_KEY"
else
    log "❌ 上传失败"
    log "$UPLOAD_RESULT"
    rm -f "$TEST_FILE"
    exit 1
fi
log ""

# 测试 3: 列出文件
log "[3/5] 测试列出文件..."
LIST_RESULT=$(curl -s "${API_URL}/api/storage/files?prefix=documents/&maxKeys=5")

if echo "$LIST_RESULT" | grep -q '"success":true'; then
    log "✅ 列表获取成功"
else
    log "❌ 列表获取失败"
    log "$LIST_RESULT"
fi
log ""

# 测试 4: 获取下载链接
if [ -n "$FILE_KEY" ]; then
    log "[4/5] 测试获取下载链接..."
    DOWNLOAD_RESULT=$(curl -s "${API_URL}/api/storage/files/${FILE_KEY}")
    
    if echo "$DOWNLOAD_RESULT" | grep -q '"success":true'; then
        log "✅ 下载链接获取成功"
        DOWNLOAD_URL=$(echo "$DOWNLOAD_RESULT" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        log "   链接: ${DOWNLOAD_URL:0:80}..."
    else
        log "❌ 下载链接获取失败"
        log "$DOWNLOAD_RESULT"
    fi
fi
log ""

# 测试 5: 删除文件
if [ -n "$FILE_KEY" ]; then
    log "[5/5] 测试删除文件..."
    DELETE_RESULT=$(curl -s -X DELETE "${API_URL}/api/storage/files/${FILE_KEY}")
    
    if echo "$DELETE_RESULT" | grep -q '"success":true'; then
        log "✅ 删除成功"
    else
        log "❌ 删除失败"
        log "$DELETE_RESULT"
    fi
fi
log ""

# 清理测试文件
rm -f "$TEST_FILE"

log "=========================================="
log "  ✅ 测试完成！"
log "=========================================="
log ""
log "📄 日志文件: $LOG_FILE"
