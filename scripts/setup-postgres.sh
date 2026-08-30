#!/usr/bin/env bash
set -Eeuo pipefail

: "${DB_NAME:=pi_cube}"
: "${DB_USER:=pi_user}"
: "${DB_PASSWORD:?请通过环境变量设置 DB_PASSWORD}"

if [[ ! "$DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "DB_NAME 格式无效" >&2
  exit 1
fi

if [[ ! "$DB_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "DB_USER 格式无效" >&2
  exit 1
fi

sudo -u postgres psql \
  --set=ON_ERROR_STOP=1 \
  --set=db_name="$DB_NAME" \
  --set=db_user="$DB_USER" \
  --set=db_password="$DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

echo "数据库初始化完成。远程访问和防火墙规则需按部署环境单独配置。"
