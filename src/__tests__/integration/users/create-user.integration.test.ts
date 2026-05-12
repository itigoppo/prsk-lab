import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDiscordUser, insertMockUser } from "../../mocks/factories"

// グローバルfetchのモック
global.fetch = vi.fn()

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

describe("POST /api/users (Discord認証)", () => {
  const MOCK_DISCORD_ID = "discord-123456"

  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトは認証成功
    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/users (Discord認証)", () => {
    it("有効なDiscordトークンで新規ユーザーを作成できる", async () => {
      const mockDiscordUser = createMockDiscordUser({
        avatar: "discord_avatar_hash",
        email: "discord@example.com",
        global_name: "Discord User",
        id: "discord-123456",
        username: "discorduser",
      })

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer valid_discord_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.discordId).toBe(mockDiscordUser.id)
      expect(json.data.user.name).toBe(mockDiscordUser.username)
      expect(json.data.user.email).toBe(mockDiscordUser.email)

      // Discord APIが呼ばれたことを確認
      expect(global.fetch).toHaveBeenCalledWith("https://discord.com/api/users/@me", {
        headers: {
          Authorization: "Bearer valid_discord_token",
        },
      })
    })

    it("Authorizationヘッダーがない場合は401を返す", async () => {
      const res = await openAPIApp.request("/api/users", {
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")

      // Discord APIは呼ばれない
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("Bearer形式でない場合は401を返す", async () => {
      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Basic invalid_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Missing or invalid Authorization header")

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("無効なDiscordトークンの場合は401を返す", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer invalid_discord_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("Invalid Discord token")
    })

    it("Discord APIがネットワークエラーの場合は401を返す", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"))

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer valid_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.message).toBe("Invalid discord token")
      expect(json.error).toBeDefined()
    })

    it("既存ユーザーの場合は更新される", async () => {
      // 既存ユーザーをデータベースに作成
      await insertMockUser({
        discordId: MOCK_DISCORD_ID,
        email: "old@example.com",
        name: "Old Name",
      })

      const mockDiscordUser = createMockDiscordUser({
        avatar: "new_avatar_hash",
        email: "new@example.com",
        global_name: "New Name",
        id: MOCK_DISCORD_ID,
        username: "newuser",
      })

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer valid_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.name).toBe("newuser")

      const updatedUser = await prisma.user.findUnique({
        where: { discordId: MOCK_DISCORD_ID },
      })
      expect(updatedUser?.name).toBe("newuser")
      expect(updatedUser?.email).toBe("new@example.com")
      expect(updatedUser?.avatarUrl).toContain("new_avatar_hash")
    })

    it("Discord APIからのIDが空等でバリデーションエラーの場合は400を返す", async () => {
      const mockDiscordUser = createMockDiscordUser({
        id: "", // 空文字はZodでエラーになる
      })

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer valid_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("入力内容に誤りがあります")
    })
  })
})
