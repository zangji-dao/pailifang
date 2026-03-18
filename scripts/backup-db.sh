#!/bin/bash

# 数据库备份脚本
# 用法: ./scripts/backup-db.sh [backup|restore]

set -e

# 数据库配置
DB_HOST="152.136.12.122"
DB_PORT="5432"
DB_USER="pi_user"
DB_NAME="pi_cube"

# 备份目录
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pi_cube_${TIMESTAMP}.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

backup() {
    echo "开始备份数据库..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE
    echo "备份完成: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "压缩完成: ${BACKUP_FILE}.gz"
    
    # 清理超过7天的备份
    find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
    echo "已清理7天前的备份文件"
}

restore() {
    if [ -z "$1" ]; then
        echo "请指定要恢复的备份文件"
        echo "可用的备份文件:"
        ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "没有备份文件"
        exit 1
    fi
    
    BACKUP_FILE=$1
    
    if [[ $BACKUP_FILE == *.gz ]]; then
        echo "解压备份文件..."
        gunzip -k $BACKUP_FILE
        BACKUP_FILE="${BACKUP_FILE%.gz}"
    fi
    
    echo "开始恢复数据库..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME < $BACKUP_FILE
    echo "恢复完成"
    
    # 清理解压的文件
    rm -f $BACKUP_FILE
}

list_backups() {
    echo "可用的备份文件:"
    ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "没有备份文件"
}

case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "用法: $0 {backup|restore|list}"
        echo ""
        echo "  backup       - 创建数据库备份"
        echo "  restore FILE - 从备份文件恢复"
        echo "  list         - 列出所有备份文件"
        exit 1
        ;;
esac
