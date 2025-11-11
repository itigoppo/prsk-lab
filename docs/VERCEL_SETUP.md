# Vercel デプロイ設定

## GitHub Actionsのチェックを待つように設定

### 1. Vercelプロジェクト設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **Git** に移動
4. **Deployment Protection** セクションで以下を設定：
   - ✅ **Wait for CI checks to pass before deploying**

これにより、GitHub ActionsのCIチェックが成功するまでVercelのデプロイがブロックされます。

### 2. GitHub Branch Protection（オプション・推奨）

mainブランチを保護し、CIが通らないとマージできないようにする：

1. GitHubリポジトリの **Settings** → **Branches** に移動
2. **Add branch protection rule** をクリック
3. 以下を設定：
   - Branch name pattern: `main`
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Status checks: `lint-and-test` を選択

### 3. Vercel環境変数の設定

ビルドに必要な環境変数を設定：

1. Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables**
2. 以下の環境変数を追加：

```bash
# 必須
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_production_url

# Discord OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# その他必要な環境変数
```

## CIワークフローの動作

### 実行されるチェック

1. ✅ **ESLint**: コード品質チェック
2. ✅ **Type Check**: TypeScript型チェック
3. ✅ **Tests**: ユニットテスト＋統合テスト（259テスト）
4. ✅ **Build**: Next.jsビルドチェック

### 失敗時の動作

- ❌ いずれかのチェックが失敗 → Vercelへのデプロイがブロックされる
- ✅ 全てのチェックが成功 → Vercelが自動的にデプロイを開始

## トラブルシューティング

### ビルドで環境変数エラーが出る場合

`.github/workflows/ci.yml` の `Build check` ステップに環境変数を追加：

```yaml
- name: Build check
  run: npm run build
  env:
    DATABASE_URL: "postgresql://dummy"
    NEXTAUTH_SECRET: "dummy-secret-for-ci"
    NEXTAUTH_URL: "http://localhost:3000"
    DISCORD_CLIENT_ID: "dummy"
    DISCORD_CLIENT_SECRET: "dummy"
    SKIP_ENV_VALIDATION: true
```

### CIが遅い場合

依存関係のキャッシュは既に有効化されていますが、さらに高速化したい場合：

1. テストを並列実行
2. Turbopack/Turboレポを使用
3. テストの選択的実行（変更されたファイルのみ）
