import "next-auth"

declare module "next-auth" {
  /**
   * セッションにDiscord IDのみを含める
   * ユーザー情報（name, email, image）はサーバー側でuserテーブルから取得
   */
  interface Session {
    expires: string
    user: {
      id: string // Discord ID
    }
  }
}

declare module "next-auth/jwt" {
  /**
   * JWTにはDiscord IDのみを保存（token.sub）
   * accessTokenなどの機密情報は保存しない
   */
  interface JWT {
    sub?: string // Discord ID
  }
}
