#!/usr/bin/env bash
#
# Orca ワークツリー用セットアップスクリプト
#
# ワークツリーを作成したときに Orca の setup フックから実行される想定です。
# git 管理外のファイル（.env / .env.local、node_modules、Prisma Client、Orval の生成物）は
# 新しいワークツリーには存在しないため、ここで揃えます。
#
# DB はワークツリーごとに分けます。ただしコンテナは増やさず、main チェックアウト
# (~/git/prsk-lab) の prsk-postgres の中にこのワークツリー専用の DB を作ります。
# docker-compose.yaml は container_name とポートが固定のうえ、データを ./postgres/data に
# 置くため、ワークツリーで compose を起動すると main と衝突します。
#
#   開発用: prsk_lab_wt_<ワークツリー名>       (.env / .env.local を書き換える)
#   テスト: prsk_lab_wt_<ワークツリー名>_test  (.env.test.local を作る)
#
# 何度実行しても大丈夫です。DB が既にあれば作り直さず、マイグレーションだけ流します。
#
# 使い方:
#   bash .orca/setup.sh

set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

# shellcheck source=lib.sh
. .orca/lib.sh

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '\033[1;33m[warn] %s\033[0m\n' "$1" >&2; }
fail() { printf '\033[1;31m[error] %s\033[0m\n' "$1" >&2; exit 1; }

# ---------- main チェックアウトを特定する ----------
MAIN="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
IS_MAIN=0
[ "$MAIN" = "$ROOT" ] && IS_MAIN=1

# ---------- git 管理外の .env を main からコピーする ----------
# .env*.example と .env.test は git 管理下なのでコピー不要
# .env.production は本番の値、.env.test.local はワークツリーごとに作るので持ち込まない
step ".env を main チェックアウトから引き継ぎます"
if [ "$IS_MAIN" -eq 1 ]; then
  info "ここは main チェックアウトなのでコピーは不要です。"
else
  copied=0
  while read -r rel; do
    [ -n "$rel" ] || continue
    [ -e "$rel" ] && continue
    mkdir -p "$(dirname "$rel")"
    cp "$MAIN/$rel" "$rel"
    info "copied: $rel"
    copied=$((copied + 1))
  done < <(
    git -C "$MAIN" ls-files --others --ignored --exclude-standard -- '.env*' '*/.env*' \
      | grep -vE '(^|/)node_modules/|(^|/)\.env\.production|(^|/)\.env\.test\.local'
  )
  if [ "$copied" -eq 0 ]; then
    info "コピーするものはありませんでした。"
  fi
fi

for f in .env .env.local; do
  if [ ! -f "$f" ]; then
    warn "$f がありません。main チェックアウトにも無いようです。"
    warn "  cp $f.example $f してから設定してください (README 参照)。"
  fi
done

# ---------- ワークツリー用に .env の接続先を書き換える ----------
# main の DB を触らないよう、DB を作れたかどうかに関係なく先に向け先を変えておく
env_set() { # file key value -> 変更したら 0
  file="$1"
  key="$2"
  value="$3"

  if grep -qE "^${key}=" "$file"; then
    [ "$(grep -E "^${key}=" "$file" | head -1 | cut -d= -f2-)" = "$value" ] && return 1
    awk -v k="$key" -v v="$value" '
      BEGIN { FS = "=" }
      $1 == k { print k "=" v; next }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  else
    # 末尾に改行が無いと次の行とくっつく
    [ -s "$file" ] && [ -n "$(tail -c1 "$file")" ] && printf '\n' >> "$file"
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi

  return 0
}

step "ワークツリー専用の DB に向けて .env を書き換えます"
if [ "$IS_MAIN" -eq 1 ]; then
  info "ここは main チェックアウトなので書き換えません。"
else
  for f in .env .env.local; do
    [ -f "$f" ] || continue
    changed=0
    env_set "$f" DATABASE_URL "$(pg_url "$WT_DB")" && changed=1
    env_set "$f" DIRECT_URL "$(pg_url "$WT_DB")" && changed=1
    if [ "$changed" -eq 1 ]; then
      info "$f -> $WT_DB"
    else
      info "$f はすでに $WT_DB を向いています。"
    fi
  done

  # .env.test は git 管理下なので触らない。test:integration は .env.test.local を優先して読む
  if [ ! -f .env.test.local ]; then
    printf '# .orca/setup.sh が作成。このワークツリー専用のテスト DB\n' > .env.test.local
  fi
  changed=0
  env_set .env.test.local DATABASE_URL "$(pg_url "$WT_TEST_DB")" && changed=1
  env_set .env.test.local DIRECT_URL "$(pg_url "$WT_TEST_DB")" && changed=1
  if [ "$changed" -eq 1 ]; then
    info ".env.test.local -> $WT_TEST_DB"
  else
    info ".env.test.local はすでに $WT_TEST_DB を向いています。"
  fi
fi

# ---------- Node.js (mise) ----------
# 新しいディレクトリの mise.toml は信頼されていないため、そのままだと node が解決できない
step "Node.js を準備します (mise)"
if command -v mise >/dev/null 2>&1; then
  mise trust --quiet "$ROOT/mise.toml" || warn "mise trust に失敗しました。"
  mise install || warn "mise install に失敗しました。"
  info "node $(mise exec -- node --version 2>/dev/null || echo '?')"
else
  warn "mise が見つからないためスキップします。node $(node --version 2>/dev/null || echo '(未インストール)') を使います。"
fi

# ---------- 依存関係 ----------
# postinstall で prisma generate、prepare で husky (pre-commit) も設定される
step "依存関係をインストールします (pnpm install)"
command -v pnpm >/dev/null 2>&1 || fail "pnpm が見つかりません (corepack enable pnpm)。"
pnpm install --frozen-lockfile || fail "pnpm install に失敗しました。"

if [ "$(git config core.hooksPath)" = ".husky/_" ]; then
  info "husky (pre-commit) は有効です。"
else
  warn "husky が有効になっていません。pnpm run prepare を試してください。"
fi

# ---------- API クライアント生成 ----------
# src/lib/api/generated は git 管理外。無いと型チェックもビルドも通らない
step "API クライアントを生成します (orval)"
pnpm generate:api || fail "orval に失敗しました。"

# ---------- ワークツリー専用 DB ----------
step "ワークツリー専用の DB を用意します ($PG_CONTAINER 内)"
DB_READY=0
if [ "$IS_MAIN" -eq 1 ]; then
  info "ここは main チェックアウトなのでスキップします。"
elif ! pg_running; then
  warn "$PG_CONTAINER が起動していないためスキップします。main チェックアウトで起動してから再実行してください:"
  warn "  (cd $MAIN && make docker-up) && bash .orca/setup.sh"
else
  created=0
  for db in "$WT_DB" "$WT_TEST_DB"; do
    if pg_db_exists "$db"; then
      info "$db: 既にあります"
    elif pg_exec createdb -U "$PG_USER" "$db"; then
      info "$db: 作成しました"
      [ "$db" = "$WT_DB" ] && created=1
    else
      fail "$db の作成に失敗しました。"
    fi
  done

  # テスト DB のスキーマは test:integration が毎回 prisma db push で合わせるのでここでは触らない
  if pnpm exec prisma migrate deploy; then
    DB_READY=1
  else
    warn "マイグレーションに失敗しました。make prisma-deploy を手で試してください。"
  fi

  # シードは冪等ではないので、DB を作ったときだけ流す
  if [ "$DB_READY" -eq 1 ] && [ "$created" -eq 1 ]; then
    # seed は実行前に y/N を聞いてくる
    if echo y | make seed; then
      info "シードを流しました。"
    else
      warn "シードに失敗しました。make seed を手で試してください。"
    fi
  fi
fi

# ---------- 完了 ----------
cat <<MSG

ワークツリーのセットアップが完了しました。

  make run               # 開発サーバー (http://localhost:30000)
  make check             # lint / 型チェック
  make test-unit         # ユニットテスト
  make test-integration  # 統合テスト ($WT_TEST_DB を使用)

MSG

if [ "$IS_MAIN" -eq 0 ]; then
  cat <<MSG
DB はこのワークツリー専用です ($WT_DB)。main の DB には影響しません。
make prisma-migrate / make prisma-reset / make seed もこの DB に対して実行されます。
MSG
  [ "$DB_READY" -eq 1 ] || echo "※ DB はまだ用意できていません。上の警告を確認してください。"
  echo ""
fi

echo "開発サーバーのポート (30000) は固定のため、main や他のワークツリーと同時には起動できません。"
