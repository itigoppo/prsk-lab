import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDiscordUser, createMockUser, generateAvatarUrl } from "../mocks/factories"

// グローバルfetchのモック
global.fetch = vi.fn()

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("Discord Protected Routes Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /api/users", () => {
    it("有効なDiscordトークンで新規ユーザーを作成できる", async () => {
      const mockDiscordUser = createMockDiscordUser({
        avatar: "discord_avatar_hash",
        email: "discord@example.com",
        global_name: "Discord User",
        id: "discord-123456",
        username: "discorduser",
      })

      const mockCreatedUser = createMockUser({
        avatarUrl: generateAvatarUrl(mockDiscordUser.id, mockDiscordUser.avatar!),
        discordId: mockDiscordUser.id,
        email: mockDiscordUser.email,
        id: "user-uuid-123",
        name: mockDiscordUser.global_name,
      })

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      vi.mocked(prisma.user.upsert).mockResolvedValueOnce(mockCreatedUser)

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
      expect(json.data.user.name).toBe(mockDiscordUser.global_name)
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

    it("データベースエラーの場合は500を返す", async () => {
      const mockDiscordUser = createMockDiscordUser({
        id: "discord-db-error",
      })

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockDiscordUser,
        ok: true,
      } as Response)

      vi.mocked(prisma.user.upsert).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/users", {
        headers: {
          Authorization: "Bearer valid_discord_token",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })
})
