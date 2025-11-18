import { HTTP_STATUS } from "@/constants/http-status"
import { MiddlewareHandler } from "hono"
import { jwtDecrypt } from "jose"
import { deriveKey } from "../crypto/hkdf"
import { parseCookies } from "../utils/cookie-parser"

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!

export const verifyNextAuthSession: MiddlewareHandler = async (c, next) => {
  // Hono の Request から Cookie を取得
  const cookieHeader = c.req.header("Cookie") || ""
  const cookies = parseCookies(cookieHeader)

  const isSecure = process.env.NODE_ENV === "production"
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token"
  const encryptedToken = cookies[cookieName]
  if (!encryptedToken) {
    return c.json({ message: "Missing session token", success: false }, HTTP_STATUS.UNAUTHORIZED)
  }

  try {
    const ikm = new TextEncoder().encode(NEXTAUTH_SECRET)
    const salt = new Uint8Array(16) // 適宜変更可
    const info = new TextEncoder().encode("NextAuth.js Generated Encryption Key")
    const keyLen = 32

    const secret = await deriveKey(ikm, salt, info, keyLen)
    const { payload } = await jwtDecrypt(encryptedToken, secret)

    if (!payload || !payload.sub) {
      return c.json({ message: "Invalid session token", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }
    c.set("discordId", payload.sub)

    await next()
  } catch (e) {
    return c.json({ error: e, message: "Invalid session token" }, HTTP_STATUS.UNAUTHORIZED)
  }
}
