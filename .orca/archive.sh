#!/usr/bin/env bash
#
# Orca ワークツリー削除時のクリーンアップスクリプト
#
# .orca/setup.sh が prsk-postgres の中に作ったワークツリー専用の DB を削除します。
# 消し忘れると main のコンテナに DB が残り続けるため、Orca の archive フックから
# 実行される想定です。
#
# node_modules / .env はワークツリーのディレクトリごと消えるのでここでは何もしません。
#
# 使い方:
#   bash .orca/archive.sh

set -uo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=lib.sh
. .orca/lib.sh

MAIN="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
if [ "$MAIN" = "$PWD" ]; then
  echo "ここは main チェックアウトなので何もしません。"
  exit 0
fi

if ! pg_running; then
  echo "$PG_CONTAINER が起動していないため何もしません。"
  echo "あとで消す場合: docker exec $PG_CONTAINER dropdb -U $PG_USER --if-exists --force $WT_DB"
  exit 0
fi

for db in "$WT_DB" "$WT_TEST_DB"; do
  if ! pg_db_exists "$db"; then
    echo "$db はありません。"
  elif pg_exec dropdb -U "$PG_USER" --force "$db"; then
    echo "$db を削除しました。"
  else
    echo "$db の削除に失敗しました。" >&2
  fi
done

echo "クリーンアップが完了しました。"
