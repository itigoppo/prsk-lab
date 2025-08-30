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

`DATABASE_URL` はDocker Composeに設定されている情報、 `NEXTAUTH_URL` はpackage.jsonに設定された起動ポートをそれぞれ書いているので変更しなくて大丈夫です

### Start Docker Containers

```bash
make docker-build # 初回のみ
make docker-up
```

### Start Development Server

```bash
make run
```

Open [http://localhost:30000](http://localhost:30000) with your browser to see the result.

## Tech Stack

- Next.js
- TypeScript
- NextAuth
- Tailwind CSS
- Hono
- Docker
- PostgreSQL
