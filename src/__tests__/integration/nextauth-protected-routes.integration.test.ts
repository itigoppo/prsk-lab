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
// テスト環境ではCookieヘッダーが通らないため、ミドルウェア全体をモック
import type { Context, Next } from "hono"

const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import { validateCsvUrl } from "@/lib/utils/csv-validator"

describe("NextAuth Protected Routes Integration Tests", () => {
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

  describe("GET /api/users/me", () => {
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
      // 認証失敗のモック
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
      // 認証失敗のモック
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

      // CSV検証が呼ばれたことを確認
      expect(validateCsvUrl).toHaveBeenCalledWith(leaderSheetUrl)

      // データベースに保存されたことを確認
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

      // データベースには保存されない
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
      // 認証失敗のモック
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

      // CSV検証が呼ばれたことを確認
      expect(validateCsvUrl).toHaveBeenCalledWith(leaderSheetUrl)

      // データベースが更新されたことを確認
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

      // データベースは更新されない
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
      // 認証失敗のモック
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
