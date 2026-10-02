# .orca/setup.sh と .orca/archive.sh で共有する定義
#
# ワークツリーの DB は main の prsk-postgres コンテナの中に作る。
# 接続情報は docker-compose.yaml の値に合わせている。

PG_CONTAINER="prsk-postgres"
PG_USER="devuser"
PG_PASSWORD="devpass"
PG_HOST_PORT="localhost:15432"

# ワークツリー名から DB 名を作る（Postgres の識別子は 63 文字まで）
WT_SLUG="$(printf '%s' "$(basename "$PWD")" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9_' '_' | cut -c1-40)"
WT_DB="prsk_lab_wt_${WT_SLUG}"
WT_TEST_DB="${WT_DB}_test"

pg_url() { printf 'postgresql://%s:%s@%s/%s' "$PG_USER" "$PG_PASSWORD" "$PG_HOST_PORT" "$1"; }

pg_running() {
  docker info >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"
}

pg_exec() { docker exec "$PG_CONTAINER" "$@"; }

pg_db_exists() {
  [ "$(pg_exec psql -U "$PG_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$1'")" = "1" ]
}
