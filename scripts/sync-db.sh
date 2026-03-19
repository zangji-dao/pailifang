#!/bin/bash

# 从生产数据库同步数据到测试数据库
# 用途：让沙箱环境数据与生产环境保持一致

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 数据库配置
PG_HOST="152.136.12.122"
PG_PORT="5432"
PG_USER="pi_user"
PG_PASSWORD="${PG_PASSWORD:-PiCube2024}"
PROD_DB="pi_cube"
DEV_DB="pi_cube_dev"

# 需要同步的表（按依赖顺序）
TABLES=(
    "users"
    "customers"
    "ledgers"
    "bases"
    "meters"
    "spaces"
    "reg_numbers"
    "accounts"
    "accounting_schemas"
    "accounting_subjects"
    "vouchers"
    "voucher_entries"
    "work_orders"
    "profit_shares"
)

confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC} [y/N]: )" response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 检查 psql 和 pg_dump
if ! command -v psql &> /dev/null || ! command -v pg_dump &> /dev/null; then
    log_info "安装 postgresql-client..."
    apt-get update && apt-get install -y postgresql-client
fi

export PGPASSWORD="${PG_PASSWORD}"

echo "=============================================="
echo "  从生产数据库同步数据到测试数据库"
echo "=============================================="
echo ""
echo "源数据库: ${PROD_DB} (生产)"
echo "目标数据库: ${DEV_DB} (沙箱)"
echo ""
log_warn "⚠️  警告：这将覆盖测试数据库中的所有数据！"
echo ""

if ! confirm "确定要继续吗？"; then
    echo "操作已取消"
    exit 0
fi

# 检查目标数据库是否存在
DEV_EXISTS=$(psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DEV_DB}'")

if [[ "${DEV_EXISTS}" != "1" ]]; then
    log_info "创建测试数据库 ${DEV_DB}..."
    psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d postgres -c "CREATE DATABASE ${DEV_DB};"
fi

# 方式选择
echo ""
echo "选择同步方式："
echo "  1. 结构 + 数据（完整同步）"
echo "  2. 仅结构（表结构一致，不含数据）"
echo "  3. 仅数据（保留现有表结构）"
echo ""
read -p "请选择 [1/2/3]: " mode

case "$mode" in
    1)
        log_info "执行完整同步（结构 + 数据）..."
        
        # 先备份测试数据库的结构
        log_info "清空测试数据库..."
        psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        
        # 从生产导出并导入
        log_info "从生产数据库导出..."
        pg_dump -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} ${PROD_DB} | psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB}
        
        log_info "完整同步完成！"
        ;;
        
    2)
        log_info "执行结构同步..."
        
        # 仅同步结构
        pg_dump -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} --schema-only ${PROD_DB} | psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB}
        
        log_info "结构同步完成！"
        ;;
        
    3)
        log_info "执行数据同步..."
        
        # 清空现有数据并导入新数据
        for table in "${TABLES[@]}"; do
            log_info "同步表: ${table}"
            
            # 清空目标表
            psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB} -c "TRUNCATE TABLE ${table} CASCADE;" 2>/dev/null || true
            
            # 导出并导入数据
            pg_dump -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} --data-only -t ${table} ${PROD_DB} | psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB} 2>/dev/null || true
        done
        
        log_info "数据同步完成！"
        ;;
        
    *)
        log_error "无效选择"
        exit 1
        ;;
esac

# 验证
echo ""
log_info "验证同步结果..."
TABLE_COUNT=$(psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${DEV_DB} -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
log_info "测试数据库表数量: ${TABLE_COUNT}"

echo ""
echo "=============================================="
log_info "同步完成！"
echo "=============================================="
echo "生产数据库: ${PROD_DB} (未修改)"
echo "测试数据库: ${DEV_DB} (已同步)"
echo "=============================================="
