#!/bin/bash

# 创建沙箱环境测试数据库
# 沙箱环境使用 pi_cube_dev 数据库，与生产环境 pi_cube 隔离

set -e

# 数据库连接配置
PG_HOST="152.136.12.122"
PG_PORT="5432"
PG_USER="pi_user"
PG_PASSWORD="${PG_PASSWORD:-PiCube2024}"
DEV_DB="pi_cube_dev"
PROD_DB="pi_cube"

echo "=============================================="
echo "  初始化沙箱环境测试数据库"
echo "=============================================="

# 检查 psql 是否安装
if ! command -v psql &> /dev/null; then
    echo "psql 未安装，尝试安装 postgresql-client..."
    apt-get update && apt-get install -y postgresql-client
fi

# 设置密码环境变量
export PGPASSWORD="${PG_PASSWORD}"

# 检查数据库是否存在
echo "检查数据库 ${DEV_DB} 是否存在..."
DB_EXISTS=$(psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DEV_DB}'")

if [[ "${DB_EXISTS}" == "1" ]]; then
    echo "✅ 数据库 ${DEV_DB} 已存在"
else
    echo "创建数据库 ${DEV_DB}..."
    psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d postgres -c "CREATE DATABASE ${DEV_DB};"
    echo "✅ 数据库 ${DEV_DB} 创建成功"
fi

# 检查表是否存在
echo "检查数据库表..."
TABLE_COUNT=$(psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB} -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")

if [[ "${TABLE_COUNT}" == "0" ]]; then
    echo "数据库表为空，需要运行数据库迁移..."
    echo ""
    echo "请运行以下命令初始化表结构："
    echo "  pnpm drizzle-kit push"
else
    echo "✅ 数据库已有 ${TABLE_COUNT} 张表"
fi

echo ""
echo "=============================================="
echo "  数据库初始化完成"
echo "=============================================="
echo "沙箱数据库: ${DEV_DB}"
echo "生产数据库: ${PROD_DB} (不会被修改)"
echo "=============================================="
