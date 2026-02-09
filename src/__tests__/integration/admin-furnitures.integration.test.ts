import { HTTP_STATUS } from "@/constants/http-status"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    character: {
      findMany: vi.fn(),
    },
    furnitureGroup: {
      count: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    furnitureGroupExcludedCharacter: {
      findMany: vi.fn(),
    },
    furnitureTag: {
      count: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
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

describe("Admin Furnitures Integration Tests", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })

    // デフォルトでAdmin権限を持つユーザーとしてモック
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      discordId: MOCK_DISCORD_ID,
      id: "user-1",
      role: "Admin",
    } as never)
  })

  describe("FurnitureTag Endpoints", () => {
    describe("GET /api/admin/furniture-tags", () => {
      it("Admin権限でタグ一覧を取得できる", async () => {
        vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
          {
            _count: { furnitures: 3 },
            createdAt: new Date(),
            id: "tag-1",
            name: "タグ1",
            updatedAt: new Date(),
          },
          {
            _count: { furnitures: 5 },
            createdAt: new Date(),
            id: "tag-2",
            name: "タグ2",
            updatedAt: new Date(),
          },
        ] as never)
        vi.mocked(prisma.furnitureTag.count).mockResolvedValue(2)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.tags).toHaveLength(2)
        expect(json.data.pagination).toBeDefined()
        expect(json.data.pagination.total).toBe(2)
      })

      it("Editor権限でもタグ一覧を取得できる", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          discordId: MOCK_DISCORD_ID,
          id: "user-1",
          role: "Editor",
        } as never)
        vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([] as never)
        vi.mocked(prisma.furnitureTag.count).mockResolvedValue(0)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
      })

      it("Viewer権限では403を返す", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          discordId: MOCK_DISCORD_ID,
          id: "user-1",
          role: "Viewer",
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
        const json = await res.json()
        expect(json.success).toBe(false)
      })

      it("認証なしでは401を返す", async () => {
        mockVerifyNextAuthSession.mockImplementation(async (c) => {
          return c.json({ message: "Missing session token", success: false }, 401)
        })

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      })
    })

    describe("POST /api/admin/furniture-tags", () => {
      it("タグを作成できる", async () => {
        vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
        vi.mocked(prisma.$transaction).mockResolvedValue({
          createdAt: new Date(),
          furnitures: [],
          id: "tag-1",
          name: "新タグ",
          updatedAt: new Date(),
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          body: JSON.stringify({ name: "新タグ" }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "POST",
        })

        expect(res.status).toBe(HTTP_STATUS.CREATED)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.id).toBeDefined()
      })

      it("タグと家具を一括作成できる", async () => {
        vi.mocked(prisma.character.findMany).mockResolvedValue([
          { code: "leoneed_ichika", id: "char-1", priority: 1 },
        ] as never)
        vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([] as never)
        vi.mocked(prisma.$transaction).mockResolvedValue({
          createdAt: new Date(),
          furnitures: [
            {
              group: null,
              groupId: null,
              id: "furniture-1",
              name: "家具1",
              reactions: [
                {
                  characters: [
                    {
                      character: {
                        code: "char-1",
                        id: "char-1",
                        name: "星乃一歌",
                        short: "一歌",
                      },
                    },
                  ],
                  id: "reaction-1",
                },
              ],
            },
          ],
          id: "tag-1",
          name: "新タグ",
          updatedAt: new Date(),
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          body: JSON.stringify({
            furnitures: [
              {
                groupId: null,
                name: "家具1",
                reactions: [{ characters: ["char-1"], excludeFromGroup: false }],
              },
            ],
            name: "新タグ",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "POST",
        })

        expect(res.status).toBe(HTTP_STATUS.CREATED)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.id).toBeDefined()
      })

      it("Viewer権限では403を返す", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          discordId: MOCK_DISCORD_ID,
          id: "user-1",
          role: "Viewer",
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-tags", {
          body: JSON.stringify({ name: "新タグ" }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "POST",
        })

        expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      })
    })

    describe("GET /api/admin/furniture-tags/:tagId", () => {
      it("タグ詳細を取得できる", async () => {
        vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
          createdAt: new Date(),
          furnitures: [],
          id: "tag-1",
          name: "タグ1",
          updatedAt: new Date(),
        } as never)
        vi.mocked(prisma.furnitureGroupExcludedCharacter.findMany).mockResolvedValue([])

        const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.tag.id).toBe("tag-1")
      })

      it("存在しないタグIDでは404を返す", async () => {
        vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue(null)

        const res = await openAPIApp.request("/api/admin/furniture-tags/unknown", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      })
    })

    describe("PATCH /api/admin/furniture-tags/:tagId", () => {
      it("タグ名を更新できる", async () => {
        vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
        vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
        vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
          await (fn as (tx: unknown) => Promise<void>)({
            furniture: { create: vi.fn(), deleteMany: vi.fn() },
            furnitureTag: { update: vi.fn() },
          })
        })

        const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
          body: JSON.stringify({ name: "更新後のタグ名" }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "PATCH",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.message).toBe("タグを更新しました")
      })
    })

    describe("DELETE /api/admin/furniture-tags/:tagId", () => {
      it("タグを削除できる", async () => {
        vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
        vi.mocked(prisma.furnitureTag.delete).mockResolvedValue({ id: "tag-1" } as never)

        const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "DELETE",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.message).toBe("タグを削除しました")
      })
    })
  })

  describe("Character Endpoints", () => {
    describe("GET /api/admin/furniture-characters", () => {
      it("Admin権限でキャラクター一覧を取得できる", async () => {
        vi.mocked(prisma.character.findMany).mockResolvedValue([
          {
            avatarUrl: "https://example.com/ichika.png",
            bgColor: "#33AAEE",
            code: "leoneed_ichika",
            color: "#33AAEE",
            id: "char-1",
            name: "星乃一歌",
            short: "一歌",
            unit: {
              bgColor: "#4455DD",
              code: "leoneed",
              color: "#4455DD",
              name: "Leo/need",
              short: "レオニ",
            },
          },
        ] as never)

        const res = await openAPIApp.request("/api/admin/furniture-characters", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.characters).toHaveLength(1)
        expect(json.data.characters[0].code).toBe("leoneed_ichika")
      })

      it("Editor権限でもキャラクター一覧を取得できる", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          discordId: MOCK_DISCORD_ID,
          id: "user-1",
          role: "Editor",
        } as never)
        vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)

        const res = await openAPIApp.request("/api/admin/furniture-characters", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
      })

      it("Viewer権限では403を返す", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          discordId: MOCK_DISCORD_ID,
          id: "user-1",
          role: "Viewer",
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-characters", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
        const json = await res.json()
        expect(json.success).toBe(false)
      })

      it("認証なしでは401を返す", async () => {
        mockVerifyNextAuthSession.mockImplementation(async (c) => {
          return c.json({ message: "Missing session token", success: false }, 401)
        })

        const res = await openAPIApp.request("/api/admin/furniture-characters", {
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      })
    })
  })

  describe("FurnitureGroup Endpoints", () => {
    describe("GET /api/admin/furniture-groups", () => {
      it("グループ一覧を取得できる", async () => {
        vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
          {
            _count: { furnitures: 3 },
            createdAt: new Date(),
            excludedCharacters: [],
            id: "group-1",
            name: "グループ1",
            updatedAt: new Date(),
          },
        ] as never)
        vi.mocked(prisma.furnitureGroup.count).mockResolvedValue(1)

        const res = await openAPIApp.request("/api/admin/furniture-groups", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.groups).toHaveLength(1)
        expect(json.data.pagination).toBeDefined()
        expect(json.data.pagination.total).toBe(1)
      })
    })

    describe("POST /api/admin/furniture-groups", () => {
      it("グループを作成できる", async () => {
        vi.mocked(prisma.$transaction).mockResolvedValue({
          _count: { furnitures: 0 },
          createdAt: new Date(),
          excludedCharacters: [],
          id: "group-1",
          name: "新グループ",
          updatedAt: new Date(),
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-groups", {
          body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新グループ" }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "POST",
        })

        expect(res.status).toBe(HTTP_STATUS.CREATED)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.id).toBeDefined()
      })
    })

    describe("GET /api/admin/furniture-groups/:groupId", () => {
      it("グループ詳細を取得できる", async () => {
        vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({
          excludedCharacters: [],
          furnitures: [],
          id: "group-1",
          name: "テストグループ",
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "GET",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.group.id).toBe("group-1")
      })
    })

    describe("PATCH /api/admin/furniture-groups/:groupId", () => {
      it("グループを更新できる", async () => {
        vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue({
          _count: { furnitures: 0 },
          createdAt: new Date(),
          excludedCharacters: [],
          id: "group-1",
          name: "更新後のグループ名",
          updatedAt: new Date(),
        } as never)

        const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
          body: JSON.stringify({
            excludedCombinations: [],
            furnitureIds: [],
            name: "更新後のグループ名",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
          },
          method: "PATCH",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.message).toBe("グループを更新しました")
      })
    })

    describe("DELETE /api/admin/furniture-groups/:groupId", () => {
      it("グループを削除できる", async () => {
        vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
        vi.mocked(prisma.furnitureGroup.delete).mockResolvedValue({ id: "group-1" } as never)

        const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
          headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
          method: "DELETE",
        })

        expect(res.status).toBe(HTTP_STATUS.OK)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.message).toBe("グループを削除しました")
      })
    })
  })
})
