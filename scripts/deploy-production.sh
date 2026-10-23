#!/usr/bin/env bash
set -Eeuo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
lock_file="$root/.deploy.lock"

exec 9>"$lock_file"
if ! flock -n 9; then
  echo "Another Cash Flow deployment is still running." >&2
  exit 1
fi

cd "$root"
[[ -f .env ]] || {
  echo "Missing production environment file: $root/.env" >&2
  exit 1
}

compose=(docker compose -f compose.production.yml --env-file .env)
"${compose[@]}" config --quiet
"${compose[@]}" build api
"${compose[@]}" up -d db

for _ in $(seq 1 30); do
  if "${compose[@]}" exec -T db pg_isready -U cashflow_admin -d cashflow >/dev/null; then
    break
  fi
  sleep 2
done
"${compose[@]}" exec -T db pg_isready -U cashflow_admin -d cashflow >/dev/null || {
  echo "PostgreSQL was not ready within 60 seconds." >&2
  exit 1
}

bash "$root/scripts/backup-production.sh"
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d api

for _ in $(seq 1 30); do
  if "${compose[@]}" exec -T api \
    node -e "fetch('http://127.0.0.1:4310/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    break
  fi
  sleep 2
done
"${compose[@]}" exec -T api \
  node -e "fetch('http://127.0.0.1:4310/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || {
  echo "API was not ready within 60 seconds." >&2
  exit 1
}

"${compose[@]}" ps
echo "Cash Flow deployment completed."
