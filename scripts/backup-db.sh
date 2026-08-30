#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?请先设置 DATABASE_URL}"

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date +%Y%m%d_%H%M%S)"
backup_file="${backup_dir}/pi_cube_${timestamp}.sql"

mkdir -p "$backup_dir"

backup() {
  pg_dump "$DATABASE_URL" > "$backup_file"
  gzip "$backup_file"
  echo "备份完成: ${backup_file}.gz"
}

restore() {
  local source_file="${1:?请指定备份文件}"
  if [[ "$source_file" == *.gz ]]; then
    gzip -dc "$source_file" | psql "$DATABASE_URL"
  else
    psql "$DATABASE_URL" < "$source_file"
  fi
  echo "恢复完成"
}

list_backups() {
  find "$backup_dir" -maxdepth 1 -type f -name '*.sql.gz' -print
}

case "${1:-}" in
  backup)
    backup
    ;;
  restore)
    restore "${2:-}"
    ;;
  list)
    list_backups
    ;;
  *)
    echo "用法: $0 {backup|restore FILE|list}" >&2
    exit 1
    ;;
esac
