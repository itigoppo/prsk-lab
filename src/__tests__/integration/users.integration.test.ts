import { HTTP_STATUS } from "@/constants/http-status"
import type { User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDiscordUser, createMockUser, generateAvatarUrl } from "../mocks/factories"

// グローバルfetchのモック
global.fetch = vi.fn()

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirstOrThrow: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

// NextAuth セッション検証ミドルウェアをモック
import type { Context, Next } from "hono"

const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"

describe("Users Integration Tests", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

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

  describe("GET /api/users/me (NextAuth認証)", () => {
    it("認証済みユーザーの情報を取得できる", async () => {
      const mockUser: Pick<User, "id" | "discordId" | "name" | "email" | "avatarUrl" | "role"> = {
        avatarUrl: "https://example.com/avatar.png",
        discordId: MOCK_DISCORD_ID,
        email: "test@example.com",
        id: "user-uuid-123",
        name: "Test User",
        role: "Viewer",
      }

      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce(mockUser as User)

      const res = await openAPIApp.request("/api/users/me", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("ユーザー情報を取得しました")
      expect(json.data).toEqual({
        avatarUrl: mockUser.avatarUrl,
        discordId: mockUser.discordId,
        email: mockUser.email,
        id: mockUser.id,
        name: mockUser.name,
        role: mockUser.role,
      })
    })

    it("avatarUrlがnullのユーザーも正しく取得できる", async () => {
      const mockUser: Pick<User, "id" | "discordId" | "name" | "email" | "avatarUrl" | "role"> = {
        avatarUrl: null,
        discordId: MOCK_DISCORD_ID,
        email: "test@example.com",
        id: "user-uuid-123",
        name: "Test User",
        role: "Viewer",
      }

      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce(mockUser as User)

      const res = await openAPIApp.request("/api/users/me", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.data.avatarUrl).toBeNull()
    })

    it("認証失敗時は401を返す（Cookie なし）", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/users/me", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("ユーザーが存在しない場合は500を返す", async () => {
      vi.mocked(prisma.user.findFirstOrThrow).mockRejectedValueOnce(new Error("User not found"))

      const res = await openAPIApp.request("/api/users/me", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザー情報の取得に失敗しました")
    })
  })
})
