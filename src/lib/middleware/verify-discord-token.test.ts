import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { verifyDiscordToken } from "./verify-discord-token"

type Env = {
  Variables: {
    discordId: string
    discordUser: {
      avatar: string | null
      discriminator: string
      email: string | null
      global_name: string | null
      id: string
      username: string
    }
  }
}

// グローバルfetchのモック
global.fetch = vi.fn()

describe("verifyDiscordToken middleware", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  describe("ミドルウェアのコア機能", () => {
    it("認証成功時にdiscordIdとdiscordUserがContextにセットされる", async () => {
      const mockDiscordUser = {
        avatar: "avatar_hash",
        discriminator: "0",
        email: "user@example.com",
        global_name: "Test User",
        id: "123456789",
        username: "testuser",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => {
        return c.json({
          discordId: c.get("discordId"),
          discordUser: c.get("discordUser"),
        })
      })

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      // ミドルウェアの主要な責務：Contextへの正しい値のセット
      expect(json.discordId).toBe("123456789")
      expect(json.discordUser).toEqual(mockDiscordUser)
    })

    it("avatarやemailがnullの場合も正しくContextにセットされる", async () => {
      const mockDiscordUser = {
        avatar: null,
        discriminator: "0",
        email: null,
        global_name: null,
        id: "987654321",
        username: "minimaluser",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => {
        return c.json({
          discordId: c.get("discordId"),
          discordUser: c.get("discordUser"),
        })
      })

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(json.discordId).toBe("987654321")
      expect(json.discordUser).toEqual(mockDiscordUser)
      expect(json.discordUser.avatar).toBeNull()
      expect(json.discordUser.email).toBeNull()
    })
  })

  describe("エラーハンドリング", () => {
    it("Authorizationヘッダーがない場合は401を返す", async () => {
      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ ok: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")
    })

    it("Bearer形式でない場合は401を返す", async () => {
      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ ok: true }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Basic invalid_format",
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")
    })

    it("Discord API が401を返す場合は401を返す", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({ message: "Unauthorized" }),
        ok: false,
        status: 401,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ ok: true }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Invalid Discord token")
    })

    it("ネットワークエラーの場合は401を返す", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"))

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ ok: true }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.message).toBe("Invalid discord token")
    })
  })
})
