import NextAuth, { AuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ account, token }) {
      // NextAuthがデフォルトでDiscord ID (providerAccountId) を token.sub に保存
      // 機密情報（access_token等）は保存しない
      if (account) {
        token.sub = account.providerAccountId
      }

      return token
    },
    async session({ session, token }) {
      // クライアントに返すsessionには最小限の情報のみ含める
      // ユーザー情報はサーバー側でuserテーブルから取得するため、
      // sessionにはDiscord IDのみを含める
      return {
        expires: session.expires,
        user: {
          id: token.sub as string, // Discord ID
        },
      }
    },
    async signIn({ account }) {
      const discordId = account?.providerAccountId
      if (!discordId || !account?.access_token) {
        return false
      }

      try {
        // ログイン時に毎回Discord APIからユーザー情報を取得するためaccess_tokenを使用
        // このトークンはJWTに保存されず、この処理でのみ一時的に使用される
        // 新規ユーザーなら作成、既存ユーザーなら情報を更新（upsert）
        const baseUrl = process.env.NEXTAUTH_URL || "https://prsk-lab.vercel.app"
        const res = await fetch(`${baseUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          return false
        }

        return true
      } catch {
        return false
      }
    },
  },
  pages: {
    error: "/login",
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
