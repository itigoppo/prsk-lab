import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import { validateCsvUrl } from "@/lib/utils/csv-validator"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockUser } from "../../mocks/factories"

// CSV validatorのモック
vi.mock("@/lib/utils/csv-validator", () => ({
  validateCsvUrl: vi.fn(),
}))

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

describe("POST /api/users/settings", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/users/settings", () => {
    it("有効なCSV URLで設定を作成できる", async () => {
      const leaderSheetUrl = "https://example.com/valid-sheet.csv"

      const mockUser = await insertMockUser({ discordId: MOCK_DISCORD_ID })
      vi.mocked(validateCsvUrl).mockResolvedValueOnce({ success: true })

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("設定情報を更新しました")

      expect(validateCsvUrl).toHaveBeenCalledWith(leaderSheetUrl)

      const createdSetting = await prisma.setting.findFirst({
        where: { userId: mockUser.id },
      })
      expect(createdSetting).not.toBeNull()
      expect(createdSetting?.leaderSheetUrl).toBe(leaderSheetUrl)
    })

    it("nullのURLでも設定を作成できる", async () => {
      const mockUser = await insertMockUser({ discordId: MOCK_DISCORD_ID })

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl: null }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)

      const createdSetting = await prisma.setting.findFirst({
        where: { userId: mockUser.id },
      })
      expect(createdSetting).not.toBeNull()
      expect(createdSetting?.leaderSheetUrl).toBeNull()
    })

    it("無効なCSV URLの場合は400を返す", async () => {
      const leaderSheetUrl = "https://example.com/invalid-sheet.csv"

      vi.mocked(validateCsvUrl).mockResolvedValueOnce({
        error: "CSVのフォーマットが正しくありません",
        success: false,
      })

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("CSVのフォーマットが正しくありません")

      expect(json.message).toBe("CSVのフォーマットが正しくありません")
    })

    it("リクエストボディが不正な場合は400を返す", async () => {
      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ invalidField: "value" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl: "https://example.com/sheet.csv" }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("ユーザーが存在しない場合は401を返す", async () => {
      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl: null }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("セッションが無効です")
    })

    it("すでに設定が存在する場合は409エラーになる", async () => {
      const mockUser = await insertMockUser({ discordId: MOCK_DISCORD_ID })
      // すでに設定が存在する状態を作る
      await prisma.setting.create({
        data: {
          leaderSheetUrl: null,
          userId: mockUser.id,
        },
      })

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl: null }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.CONFLICT)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("すでに設定が存在します")
    })
  })
})
