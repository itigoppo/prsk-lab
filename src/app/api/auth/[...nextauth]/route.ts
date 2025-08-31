import { registerUser } from "@/lib/api/users/register-user"
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

      const res = await registerUser(account?.access_token as string)

      if (!res || !res.success) {
        return false
      }

      return true
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
