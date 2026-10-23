#!/usr/bin/env bash
set -Eeuo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
backup_dir=${CASHFLOW_BACKUP_DIR:-"$root/backups"}
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/cashflow-$stamp.dump"

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
umask 077

echo "Creating PostgreSQL backup before migration: $target"
docker compose -f "$root/compose.production.yml" --env-file "$root/.env" \
  exec -T db pg_dump -U cashflow_admin -d cashflow -Fc >"$target"
chmod 600 "$target"
echo "Backup completed: $target"
