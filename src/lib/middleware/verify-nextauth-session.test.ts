import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

type Env = {
  Variables: {
    discordId: string
  }
}

vi.mock("jose", () => ({
  jwtDecrypt: vi.fn(),
}))

vi.mock("../crypto/hkdf", () => ({
  deriveKey: vi.fn().mockResolvedValue(new Uint8Array(32)),
}))

vi.mock("../utils/cookie-parser", () => ({
  parseCookies: vi.fn(),
}))

import { jwtDecrypt } from "jose"
import { parseCookies } from "../utils/cookie-parser"
import { verifyNextAuthSession } from "./verify-nextauth-session"

describe("verifyNextAuthSession middleware", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  it("認証成功時にdiscordIdがContextにセットされる", async () => {
    vi.mocked(parseCookies).mockReturnValue({
      "next-auth.session-token": "encrypted-token",
    })
    vi.mocked(jwtDecrypt).mockResolvedValue({
      payload: { sub: "123456789" },
      protectedHeader: { alg: "dir", enc: "A256GCM" },
    } as never)

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ discordId: c.get("discordId") }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.discordId).toBe("123456789")
  })

  it("production環境では__Secure-プレフィックス付きCookieを参照する", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.mocked(parseCookies).mockReturnValue({
      "__Secure-next-auth.session-token": "encrypted-token",
    })
    vi.mocked(jwtDecrypt).mockResolvedValue({
      payload: { sub: "123456789" },
      protectedHeader: { alg: "dir", enc: "A256GCM" },
    } as never)

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ discordId: c.get("discordId") }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.discordId).toBe("123456789")
    vi.stubEnv("NODE_ENV", "test")
  })

  it("Cookieがない場合は401を返す", async () => {
    vi.mocked(parseCookies).mockReturnValue({})

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Missing session token")
  })

  it("セッショントークンCookieが存在しない場合は401を返す", async () => {
    vi.mocked(parseCookies).mockReturnValue({ "other-cookie": "value" })

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Missing session token")
  })

  it("JWTのpayloadにsubがない場合は401を返す", async () => {
    vi.mocked(parseCookies).mockReturnValue({
      "next-auth.session-token": "encrypted-token",
    })
    vi.mocked(jwtDecrypt).mockResolvedValue({
      payload: {},
      protectedHeader: { alg: "dir", enc: "A256GCM" },
    } as never)

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Invalid session token")
  })

  it("JWT復号に失敗した場合は401を返す", async () => {
    vi.mocked(parseCookies).mockReturnValue({
      "next-auth.session-token": "invalid-token",
    })
    vi.mocked(jwtDecrypt).mockRejectedValue(new Error("decryption failed"))

    app.use(verifyNextAuthSession)
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.message).toBe("Invalid session token")
  })
})
