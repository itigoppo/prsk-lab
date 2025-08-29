import { HTTP_STATUS } from "@/constants/http-status"
import { MiddlewareHandler } from "hono"

export const verifyDiscordToken = (): MiddlewareHandler => {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json(
        { message: "Missing or invalid Authorization header", success: false },
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    try {
      const idToken = authHeader.replace("Bearer ", "").trim()
      const res = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!res.ok) {
        return c.json(
          { message: "Invalid Discord token", success: false },
          HTTP_STATUS.UNAUTHORIZED
        )
      }

      const user = await res.json()
      c.set("discordId", user.id)
      c.set("discordUser", user)

      await next()
    } catch (e) {
      return c.json({ error: e, message: "Invalid discord token" }, HTTP_STATUS.UNAUTHORIZED)
    }
  }
}
