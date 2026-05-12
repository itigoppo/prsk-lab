import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockSetting, insertMockUser } from "../../mocks/factories"

// CSV validatorのモック
vi.mock("@/lib/utils/csv-validator", () => ({
  validateCsvUrl: vi.fn(),
}))

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/users/settings", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/users/settings", () => {
    it("認証済みユーザーの設定を取得できる", async () => {
      const mockUser = await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const mockSetting = await insertMockSetting(mockUser.id, {
        leaderSheetUrl: "https://example.com/sheet.csv",
      })

      const res = await openAPIApp.request("/api/users/settings", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("設定情報を取得しました")
      expect(json.data).toEqual({
        isRegistered: true,
        leaderSheetUrl: mockSetting.leaderSheetUrl,
      })
    })

    it("設定が存在しない場合はisRegistered: falseを返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })

      const res = await openAPIApp.request("/api/users/settings", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data).toEqual({
        isRegistered: false,
        leaderSheetUrl: null,
      })
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/users/settings", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("ユーザーが存在しない場合は401を返す", async () => {
      // ユーザーを作成せずにリクエスト
      const res = await openAPIApp.request("/api/users/settings", {
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
