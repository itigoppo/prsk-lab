import { HTTP_STATUS } from "@/constants/http-status"
import type { Setting, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
    furniture: {
      findUnique: vi.fn(),
    },
    furnitureGroupExcludedCharacter: {
      findMany: vi.fn(),
    },
    furnitureReaction: {
      findUnique: vi.fn(),
    },
    furnitureTag: {
      findMany: vi.fn(),
    },
    setting: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    user: {
      findFirstOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
    userFurniture: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    userReactionCheck: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
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

  describe("GET /api/furnitures/{unitCode}", () => {
    const mockUnit = {
      bgColor: "#4455dd",
      characters: [{ id: "char-1" }],
      code: "leoneed",
      id: "unit-1",
      name: "Leo/need",
    }

    const mockCharacters = [{ bgColor: "#33aaee", id: "char-1", name: "星乃一歌", short: "一歌" }]

    const mockVsCharacters = [{ bgColor: "#33ccbb", name: "初音ミク" }]

    const mockTags = [
      {
        furnitures: [
          {
            groupId: null,
            id: "furniture-1",
            name: "ソファ",
            reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
          },
        ],
        id: "tag-1",
        name: "ユニットの部屋",
      },
    ]

    it("認証済みユーザーが家具一覧を取得できる", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValueOnce(mockTags as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.furnitureGroupExcludedCharacter.findMany).mockResolvedValueOnce([] as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValueOnce([] as never)

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.unitCode).toBe("leoneed")
      expect(json.data.unitName).toBe("Leo/need")
      expect(json.data.tags).toHaveLength(1)
    })

    it("認証失敗時は401を返す（Cookie なし）", async () => {
      // 認証失敗のモック
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("存在しないユニットコードの場合は404を返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/furnitures/invalid", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユニットが見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })

  describe("POST /api/reactions/{reactionId}/check", () => {
    it("認証済みユーザーがリアクションをチェックできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValueOnce({
        id: "reaction-1",
      } as never)
      vi.mocked(prisma.userReactionCheck.upsert).mockResolvedValueOnce({
        id: "check-1",
        reactionId: "reaction-1",
        userId: "user-1",
      } as never)

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(true)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("リアクションが存在しない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/reactions/invalid-reaction/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })

  describe("DELETE /api/reactions/{reactionId}/check", () => {
    it("認証済みユーザーがリアクションのチェックを解除できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(false)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })

  describe("GET /api/furnitures", () => {
    const mockTags = [
      {
        furnitures: [
          { id: "furniture-1", name: "ソファ" },
          { id: "furniture-2", name: "テーブル" },
        ],
        id: "tag-1",
        name: "リビング",
      },
    ]

    it("認証済みユーザーが家具一覧を取得できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        ownedFurnitures: [{ furnitureId: "furniture-1" }],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValueOnce(mockTags as never)

      const res = await openAPIApp.request("/api/furnitures", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(2)
      expect(json.data.tags[0].furnitures[0].owned).toBe(true)
      expect(json.data.tags[0].furnitures[1].owned).toBe(false)
    })

    it("検索クエリで家具をフィルタリングできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValueOnce([
        {
          furnitures: [{ id: "furniture-1", name: "ソファ" }],
          id: "tag-1",
          name: "リビング",
        },
      ] as never)

      const res = await openAPIApp.request("/api/furnitures?q=ソファ", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/furnitures", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })

  describe("POST /api/furnitures/{furnitureId}/own", () => {
    it("認証済みユーザーが家具を所持登録できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-1" } as never)
      vi.mocked(prisma.furniture.findUnique).mockResolvedValueOnce({ id: "furniture-1" } as never)
      vi.mocked(prisma.userFurniture.upsert).mockResolvedValueOnce({
        furnitureId: "furniture-1",
        id: "uf-1",
        userId: "user-1",
      } as never)

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.furnitureId).toBe("furniture-1")
      expect(json.data.owned).toBe(true)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("家具が見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-1" } as never)
      vi.mocked(prisma.furniture.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("家具が見つかりません")
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })

  describe("DELETE /api/furnitures/{furnitureId}/own", () => {
    it("認証済みユーザーが家具の所持を解除できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-1" } as never)
      vi.mocked(prisma.userFurniture.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.furnitureId).toBe("furniture-1")
      expect(json.data.owned).toBe(false)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/furnitures/own/furniture-1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })
})
