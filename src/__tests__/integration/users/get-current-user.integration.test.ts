import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockUser } from "../../mocks/factories"

// グローバルfetchのモック
global.fetch = vi.fn()

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/users/me (NextAuth認証)", () => {
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

  describe("GET /api/users/me (NextAuth認証)", () => {
    it("認証済みユーザーの情報を取得できる", async () => {
      const mockUser = await insertMockUser({
        avatarUrl: "https://example.com/avatar.png",
        discordId: MOCK_DISCORD_ID,
        email: "test@example.com",
        name: "Test User",
        role: "Viewer",
      })

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
      await insertMockUser({
        avatarUrl: null,
        discordId: MOCK_DISCORD_ID,
        email: "test@example.com",
        name: "Test User",
        role: "Viewer",
      })

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
    })

    it("ユーザーが存在しない場合は401を返す", async () => {
      // ユーザーをDBに作成しない状態でリクエストを送る
      const res = await openAPIApp.request("/api/users/me", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("セッションが無効です")
    })
  })
})
