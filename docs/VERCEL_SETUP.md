# Vercel デプロイ設定

## GitHub ActionsでVercelへの自動デプロイを制御

このプロジェクトでは、Vercelの自動デプロイを無効化し、GitHub ActionsのCIチェックが全て成功した後にのみデプロイを実行する設定になっています。

## 設定手順

### 1. Vercel Tokensの取得

1. [Vercel Dashboard](https://vercel.com/account/tokens) にアクセス
2. **Create Token** をクリック
3. トークン名を入力（例: `GitHub Actions CI/CD`）
4. スコープを選択（`Full Account`を推奨）
5. **Create** をクリック
6. 表示されたトークンをコピー（**一度しか表示されないので注意**）

### 2. Vercel Project IDとOrg IDの取得

#### Project IDの取得

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **General** に移動
4. **Project ID** をコピー

#### Org ID（User ID）の取得

1. [Account Settings](https://vercel.com/account/settings) にアクセス
2. **General** タブを開く
3. **User ID** をコピー（これがOrg ID）

### 3. GitHubリポジトリへのSecretsの登録

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリックして以下の3つを追加：

| Secret名            | 説明                   | 取得元      |
| ------------------- | ---------------------- | ----------- |
| `VERCEL_TOKEN`      | Vercel API Token       | 手順1で取得 |
| `VERCEL_ORG_ID`     | Vercel Organization ID | 手順2で取得 |
| `VERCEL_PROJECT_ID` | Vercel Project ID      | 手順2で取得 |

### 4. Vercel環境変数の設定

ビルドに必要な環境変数を設定：

1. Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables**
2. 以下の環境変数を **Production** 環境に追加：

```bash
# 必須
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_production_url

# Discord OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### 5. vercel.jsonの確認

プロジェクトルートの `vercel.json` で、GitHubの自動デプロイが無効化されていることを確認：

```json
{
  "github": {
    "enabled": false
  }
}
```

この設定により、Vercelは自動デプロイを行わず、GitHub Actionsからのデプロイのみを受け付けます。

## デプロイフロー

### 実行されるチェック（全て成功する必要あり）

1. ✅ **ESLint**: コード品質チェック
2. ✅ **Type Check**: TypeScript型チェック
3. ✅ **Test Coverage**: 全ハンドラーにユニットテスト＋統合テストが存在するかチェック
4. ✅ **Tests**: ユニットテスト＋統合テスト（277テスト）
5. ✅ **Build**: Next.jsビルドチェック

### デプロイの実行条件

- ✅ mainブランチへのpush
- ✅ 上記全てのCIチェックが成功

### 動作フロー

```
mainブランチにpush
  ↓
GitHub Actions CI実行
  ├─ Lint ✓
  ├─ Type Check ✓
  ├─ Test Coverage ✓
  ├─ Tests (277) ✓
  └─ Build ✓
      ↓
   全て成功
      ↓
Vercelへデプロイ実行
  ├─ vercel pull (環境情報取得)
  ├─ vercel build --prod (ビルド)
  └─ vercel deploy --prebuilt --prod (デプロイ)
      ↓
   デプロイ完了
```

### Pull Request時の動作

- PRを作成すると、CIチェックのみが実行されます（デプロイは実行されません）
- 全てのチェックが成功すると、マージが可能になります
- mainブランチにマージされると、自動的にデプロイが実行されます

## GitHub Branch Protection（推奨）

mainブランチを保護し、CIが通らないとマージできないようにする：

1. GitHubリポジトリの **Settings** → **Branches** に移動
2. **Add branch protection rule** をクリック
3. 以下を設定：
   - Branch name pattern: `main`
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Status checks: `lint-and-test` を選択

これにより、CIチェックが失敗したPRはmainブランチにマージできなくなります。

## トラブルシューティング

### デプロイが実行されない場合

1. **GitHub Secretsの確認**
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` が正しく設定されているか確認

2. **vercel.jsonの確認**
   - `github.enabled: false` が設定されているか確認

3. **ブランチの確認**
   - mainブランチへのpushか確認（PRではデプロイされません）

### Vercelビルドでエラーが出る場合

1. **環境変数の確認**
   - Vercel Dashboardで必要な環境変数が全て設定されているか確認

2. **ローカルでビルドテスト**

   ```bash
   npm run build
   ```

3. **Vercelのログを確認**
   - GitHub Actionsの `Deploy to Vercel` ジョブのログを確認

### CIが遅い場合

依存関係のキャッシュは既に有効化されていますが、さらに高速化したい場合：

1. テストを並列実行
2. Turbopack/Turboレポを使用
3. テストの選択的実行（変更されたファイルのみ）

## 参考リンク

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
