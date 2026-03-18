#!/bin/bash

# Π立方会计系统 - 对象存储测试脚本
# 使用方式: ./scripts/test-storage.sh

echo "=========================================="
echo "  对象存储服务测试"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# API 地址
API_URL="http://localhost:4001"

# 测试文件
TEST_FILE="/tmp/pi-cube-test-${RANDOM}.txt"

# 创建测试文件
echo "这是一个测试文件，用于验证对象存储功能。" > "$TEST_FILE"
echo "创建时间: $(date)" >> "$TEST_FILE"
echo "随机ID: ${RANDOM}" >> "$TEST_FILE"

echo ""
echo "📋 测试文件: $TEST_FILE"
echo ""

# 测试 1: 健康检查
echo -e "${YELLOW}[1/5] 测试健康检查...${NC}"
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ 服务正常${NC}"
else
    echo -e "${RED}❌ 服务异常${NC}"
    echo "$HEALTH"
    exit 1
fi
echo ""

# 测试 2: 上传文件
echo -e "${YELLOW}[2/5] 测试上传文件...${NC}"
UPLOAD_RESULT=$(curl -s -X POST "${API_URL}/api/storage/upload" \
    -F "file=@${TEST_FILE}" \
    -F "type=document")

if echo "$UPLOAD_RESULT" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 上传成功${NC}"
    FILE_KEY=$(echo "$UPLOAD_RESULT" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
    FILE_URL=$(echo "$UPLOAD_RESULT" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    echo "   文件路径: $FILE_KEY"
    echo "   访问链接: ${FILE_URL:0:60}..."
else
    echo -e "${RED}❌ 上传失败${NC}"
    echo "$UPLOAD_RESULT"
    rm -f "$TEST_FILE"
    exit 1
fi
echo ""

# 测试 3: 列出文件
echo -e "${YELLOW}[3/5] 测试列出文件...${NC}"
LIST_RESULT=$(curl -s "${API_URL}/api/storage/files?prefix=documents/&maxKeys=5")

if echo "$LIST_RESULT" | grep -q '"success":true'; then
    FILE_COUNT=$(echo "$LIST_RESULT" | grep -o '"key"' | wc -l)
    echo -e "${GREEN}✅ 列表获取成功${NC}"
    echo "   找到文件数: $FILE_COUNT"
else
    echo -e "${RED}❌ 列表获取失败${NC}"
    echo "$LIST_RESULT"
fi
echo ""

# 测试 4: 获取下载链接
if [ -n "$FILE_KEY" ]; then
    echo -e "${YELLOW}[4/5] 测试获取下载链接...${NC}"
    DOWNLOAD_RESULT=$(curl -s "${API_URL}/api/storage/files/${FILE_KEY}")
    
    if echo "$DOWNLOAD_RESULT" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ 下载链接获取成功${NC}"
        DOWNLOAD_URL=$(echo "$DOWNLOAD_RESULT" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        echo "   下载链接: ${DOWNLOAD_URL:0:60}..."
    else
        echo -e "${RED}❌ 下载链接获取失败${NC}"
        echo "$DOWNLOAD_RESULT"
    fi
else
    echo -e "${YELLOW}[4/5] 跳过下载链接测试（文件路径为空）${NC}"
fi
echo ""

# 测试 5: 删除文件
if [ -n "$FILE_KEY" ]; then
    echo -e "${YELLOW}[5/5] 测试删除文件...${NC}"
    DELETE_RESULT=$(curl -s -X DELETE "${API_URL}/api/storage/files/${FILE_KEY}")
    
    if echo "$DELETE_RESULT" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ 删除成功${NC}"
    else
        echo -e "${RED}❌ 删除失败${NC}"
        echo "$DELETE_RESULT"
    fi
else
    echo -e "${YELLOW}[5/5] 跳过删除测试（文件路径为空）${NC}"
fi
echo ""

# 清理测试文件
rm -f "$TEST_FILE"

echo "=========================================="
echo -e "${GREEN}  ✅ 所有测试完成！${NC}"
echo "=========================================="
