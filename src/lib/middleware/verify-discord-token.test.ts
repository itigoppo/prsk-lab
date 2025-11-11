import { HTTP_STATUS } from "@/constants/http-status"
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

  describe("正常系", () => {
    it("有効なトークンで認証成功", async () => {
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
          message: "success",
        })
      })

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.discordId).toBe("123456789")
      expect(json.message).toBe("success")

      // Discord APIが正しく呼ばれたことを確認
      expect(global.fetch).toHaveBeenCalledWith("https://discord.com/api/users/@me", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })
    })

    it("discordUserがContextにセットされる", async () => {
      const mockDiscordUser = {
        avatar: null,
        discriminator: "1234",
        email: null,
        global_name: null,
        id: "987654321",
        username: "anotheruser",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => {
        const discordUser = c.get("discordUser")
        return c.json({
          discordUser,
          success: true,
        })
      })

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.discordUser).toEqual(mockDiscordUser)
    })
  })

  describe("異常系 - Authorization ヘッダー", () => {
    it("Authorization ヘッダーがない場合は401を返す", async () => {
      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")

      // Discord APIは呼ばれない
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("Bearer形式でない場合は401を返す", async () => {
      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Basic some_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("空のAuthorization ヘッダーの場合は401を返す", async () => {
      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe("異常系 - Discord API", () => {
    it("Discord APIがエラーを返す場合は401を返す", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(json.message).toBe("Invalid Discord token")
    })

    it("Discord APIがネットワークエラーの場合は401を返す", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"))

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.message).toBe("Invalid discord token")
      expect(json.error).toBeDefined()
    })

    it("Discord APIのレスポンスパースエラーの場合は401を返す", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => {
          throw new Error("JSON parse error")
        },
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ message: "success" }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.message).toBe("Invalid discord token")
    })
  })

  describe("エッジケース", () => {
    it("トークンに空白が含まれる場合でも正しく処理される", async () => {
      const mockDiscordUser = {
        avatar: null,
        discriminator: "0",
        email: null,
        global_name: null,
        id: "123",
        username: "user",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer  token_with_spaces  ",
        },
      })

      expect(res.status).toBe(200)

      // trimされたトークンが渡される
      expect(global.fetch).toHaveBeenCalledWith("https://discord.com/api/users/@me", {
        headers: {
          Authorization: "Bearer token_with_spaces",
        },
      })
    })

    it("Discord APIが正常だがユーザーIDがない場合", async () => {
      const mockDiscordUser = {
        avatar: null,
        discriminator: "0",
        email: null,
        global_name: null,
        // idがない
        username: "user",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => {
        return c.json({
          discordId: c.get("discordId"),
          success: true,
        })
      })

      const res = await app.request("/test", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      expect(res.status).toBe(200)

      const json = await res.json()
      // undefinedがセットされる
      expect(json.discordId).toBeUndefined()
    })

    it("複数回呼ばれても動作する", async () => {
      const mockDiscordUser = {
        avatar: null,
        discriminator: "0",
        email: null,
        global_name: null,
        id: "123",
        username: "user",
      }

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      app.use(verifyDiscordToken())
      app.get("/test", (c) => c.json({ success: true }))

      // 1回目
      const res1 = await app.request("/test", {
        headers: {
          Authorization: "Bearer token1",
        },
      })

      expect(res1.status).toBe(200)

      // 2回目
      const res2 = await app.request("/test", {
        headers: {
          Authorization: "Bearer token2",
        },
      })

      expect(res2.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe("実際のユースケース", () => {
    it("保護されたエンドポイントで使用できる", async () => {
      const mockDiscordUser = {
        avatar: "hash",
        discriminator: "0",
        email: "user@example.com",
        global_name: "User Name",
        id: "user_id_123",
        username: "username",
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      // 保護されたルート
      app.use("/api/*", verifyDiscordToken())
      app.get("/api/protected", (c) => {
        return c.json({
          message: "This is protected data",
          userId: c.get("discordId"),
        })
      })

      const res = await app.request("/api/protected", {
        headers: {
          Authorization: "Bearer valid_token",
        },
      })

      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.userId).toBe("user_id_123")
      expect(json.message).toBe("This is protected data")
    })
  })
})
