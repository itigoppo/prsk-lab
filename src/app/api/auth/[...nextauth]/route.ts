import NextAuth, { AuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ account, token }) {
      // 初回ログイン時のみアクセストークンをJWTに保存
      if (account?.access_token) {
        token.accessToken = account.access_token
      }

      return token
    },
    async signIn({ account }) {
      const discordId = account?.providerAccountId
      if (!discordId) {
        return false
      }

      try {
        // サーバーサイドなのでfetchを直接使用
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:30000"
        const res = await fetch(`${baseUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${account?.access_token}`,
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
