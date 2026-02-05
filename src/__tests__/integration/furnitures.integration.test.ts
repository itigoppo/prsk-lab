import { HTTP_STATUS } from "@/constants/http-status"
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
    furnitureTag: {
      findMany: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userFurniture: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    userReactionCheck: {
      findMany: vi.fn(),
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

describe("Furnitures Integration Tests", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
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

  describe("POST /api/furnitures/own/{furnitureId}", () => {
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

  describe("DELETE /api/furnitures/own/{furnitureId}", () => {
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
