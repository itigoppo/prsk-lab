## REST Client について

### REST Client 使用前の準備

- `tools/.env.example` を参考に、同階層に `.env` ファイルを作成してください
- ブラウザで `http://localhost:30000/login` を開いてログインしてください
- ブラウザのデベロッパーツールで `Applicaiton > Cookies > http://localhost:30000` を開きます
- Cookie の `next-auth.session-token` の値を .env ファイルの `SESSION_TOKEN` の値に設定します
- 以上により、REST Client を使って API の実行確認を行うことができるようになります（この準備をしない場合、401 ステータスコードがレスポンスされてしまいます）

- `BEARER_TOKEN` の値はDiscordAPIに送るものです
