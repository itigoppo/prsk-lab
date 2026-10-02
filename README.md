# PrskLab

## Overview

プロセカ関係でなんかやりたくなったらつくるところ

## Local Setup

### Prerequisites

- Docker
- Docker Compose
- Node.js（推奨バージョン: 20以上 / dev: v20.19.4）
- PostgreSQL（Dockerコンテナでセットアップされるため、個別にインストールする必要はありません）
- Discord開発者アカウント（OAuth設定用）

### Set up Environment Variables

`.env.local.example` ファイルをコピーして `.env.local` を作成してください。

```bash
cp .env.local.example .env.local
```

その後、以下の環境変数を設定してください。

```bash
# Discord OAuth Setup
NEXTAUTH_SECRET=your_nextauth_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

- `DISCORD_CLIENT_ID` と `DISCORD_CLIENT_SECRET` は、[Discord Developer Portal](https://discord.com/developers/applications)
  から取得できます。
  - Discordの開発者ポータルで新しいアプリケーションを作成し、Client IDとClient Secretを確認します。
  - Client IDとClient Secretは、OAuth認証に使用され、アプリケーションがDiscordのユーザー情報にアクセスするために必要です。

- `NEXTAUTH_SECRET` は、セッションの暗号化に使用するランダムな文字列です。これはセキュリティ上重要な値なので、安全な方法で生成してください。例えば、以下のようにランダムな文字列を生成できます：

```bash
make secret-generate
```

`DATABASE_URL` `DIRECT_URL` はDocker Composeに設定されている情報、 `NEXTAUTH_URL` はpackage.jsonに設定された起動ポートをそれぞれ書いているので変更しなくて大丈夫です

`.env.example` ファイルをコピーして `.env.local` を作成してください。

```bash
cp .env.example .env
```

Prisma接続用に `.env.local` で設定した `DATABASE_URL` `DIRECT_URL` と同値をいれてください

#### Set up Database on Supabase

[https://supabase.com/docs/guides/database/prisma](https://supabase.com/docs/guides/database/prisma) にアクセスしてuser作成

[https://supabase.com/dashboard/project/\_?showConnect=true](https://supabase.com/dashboard/project/_?showConnect=true) にアクセスして `ORMs` タブを開いて出てくる情報コピーして `.env` と `.env.local` に貼り付け

### Start Docker Containers

```bash
make docker-build # 初回のみ
make docker-up
```

### Database migration

```bash
make prisma-migrate
```

### Start Development Server

```bash
make run
```

Open [http://localhost:30000](http://localhost:30000) with your browser to see the result.

## Orca Worktree

Orca の repo 設定に以下を登録しています。

- Setup script: `bash .orca/setup.sh`
- Archive script: `bash .orca/archive.sh`

`setup.sh` は main チェックアウトから `.env` / `.env.local` をコピーし、依存関係のインストールと Prisma Client / API クライアントの生成をします。何度実行しても大丈夫です。

DB はワークツリーごとに分けています。コンテナは増やさず、main の `prsk-postgres` の中に専用の DB を作ります（main で `make docker-up` しておいてください）。

| 用途   | DB 名                               | 設定ファイル                              |
| ------ | ----------------------------------- | ----------------------------------------- |
| 開発   | `prsk_lab_wt_<ワークツリー名>`      | `.env` / `.env.local` を書き換え          |
| テスト | `prsk_lab_wt_<ワークツリー名>_test` | `.env.test.local`（`.env.test` より優先） |

開発用 DB にはマイグレーションとシードまで流します。`make prisma-migrate` などもこの DB に対して実行されるので、main の DB には影響しません。ワークツリーを消すと `archive.sh` が DB を削除します。

`orca worktree rm` は `--run-hooks` を付けないと archive フックを実行しないため、DB が残った場合はワークツリーで `bash .orca/archive.sh` を実行するか、以下で削除してください。

```bash
docker exec prsk-postgres dropdb -U devuser --if-exists --force prsk_lab_wt_<ワークツリー名>
```

開発サーバーのポート (30000) は固定なので、main や他のワークツリーと同時には起動できません。

## Tech Stack

- Next.js
- TypeScript
- NextAuth
- Tailwind CSS
- Hono
- Docker
- PostgreSQL
