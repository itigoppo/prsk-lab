import { HTTP_STATUS } from "@/constants/http-status"
import type { Setting, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirstOrThrow: vi.fn(),
    },
  },
}))

// CSV validatorのモック
vi.mock("@/lib/utils/csv-validator", () => ({
  validateCsvUrl: vi.fn(),
}))

// NextAuth セッション検証ミドルウェアをモック
import type { Context, Next } from "hono"

const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import { validateCsvUrl } from "@/lib/utils/csv-validator"

describe("Settings Integration Tests", () => {
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
      const mockSetting: Pick<Setting, "leaderSheetUrl"> = {
        leaderSheetUrl: "https://example.com/sheet.csv",
      }

      vi.mocked(prisma.setting.findFirst).mockResolvedValueOnce(mockSetting as Setting)

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
      vi.mocked(prisma.setting.findFirst).mockResolvedValueOnce(null)

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

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.setting.findFirst).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/users/settings", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("設定情報の取得に失敗しました")
    })
  })

  describe("POST /api/users/settings", () => {
    it("有効なCSV URLで設定を作成できる", async () => {
      const leaderSheetUrl = "https://example.com/valid-sheet.csv"

      vi.mocked(validateCsvUrl).mockResolvedValueOnce({ success: true })
      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce({
        id: "user-uuid-123",
      } as User)
      vi.mocked(prisma.setting.create).mockResolvedValueOnce({
        leaderSheetUrl,
      } as Setting)

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
      expect(prisma.setting.create).toHaveBeenCalledWith({
        data: {
          leaderSheetUrl,
          userId: "user-uuid-123",
        },
      })
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

      expect(prisma.setting.create).not.toHaveBeenCalled()
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

    it("データベースエラーの場合は500を返す", async () => {
      const leaderSheetUrl = "https://example.com/valid-sheet.csv"

      vi.mocked(validateCsvUrl).mockResolvedValueOnce({ success: true })
      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce({
        id: "user-uuid-123",
      } as User)
      vi.mocked(prisma.setting.create).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("更新中にエラーが発生しました")
    })
  })

  describe("PATCH /api/users/settings", () => {
    it("有効なCSV URLで設定を更新できる", async () => {
      const leaderSheetUrl = "https://example.com/updated-sheet.csv"

      vi.mocked(validateCsvUrl).mockResolvedValueOnce({ success: true })
      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce({
        id: "user-uuid-123",
      } as User)
      vi.mocked(prisma.setting.update).mockResolvedValueOnce({
        leaderSheetUrl,
      } as Setting)

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("設定情報を更新しました")

      expect(validateCsvUrl).toHaveBeenCalledWith(leaderSheetUrl)
      expect(prisma.setting.update).toHaveBeenCalledWith({
        data: {
          leaderSheetUrl,
        },
        where: { userId: "user-uuid-123" },
      })
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
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("CSVのフォーマットが正しくありません")

      expect(prisma.setting.update).not.toHaveBeenCalled()
    })

    it("リクエストボディが不正な場合は400を返す", async () => {
      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ invalidField: "value" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
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
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("データベースエラーの場合は500を返す", async () => {
      const leaderSheetUrl = "https://example.com/valid-sheet.csv"

      vi.mocked(validateCsvUrl).mockResolvedValueOnce({ success: true })
      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValueOnce({
        id: "user-uuid-123",
      } as User)
      vi.mocked(prisma.setting.update).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/users/settings", {
        body: JSON.stringify({ leaderSheetUrl }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("更新中にエラーが発生しました")
    })
  })
})
