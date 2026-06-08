import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  insertMockCharacter,
  insertMockFurnitureTag,
  insertMockUnit,
  insertMockUser,
} from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("PATCH /api/admin/furniture-tags/:tagId", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("PATCH /api/admin/furniture-tags/:tagId", () => {
    it("タグ名を更新できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await insertMockFurnitureTag({ id: "tag1", name: "古いタグ名" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag1", {
        body: JSON.stringify({ furnitures: [], name: "更新後のタグ名" }),
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

      const updatedTag = await prisma.furnitureTag.findUnique({ where: { id: "tag1" } })
      expect(updatedTag?.name).toBe("更新後のタグ名")
    })

    it("Editor権限でもタグを更新できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })
      await prisma.furnitureTag.create({
        data: { id: "tageditor", name: "古い", updatedAt: new Date() },
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tageditor", {
        body: JSON.stringify({ furnitures: [], name: "更新Editorタグ" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("家具とリアクションのpriorityが更新時に配列のインデックス順に設定される", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit = await insertMockUnit({ id: "unit-1" })
      await insertMockCharacter({ code: "char-1", id: "char-1", unitId: unit.id })
      await insertMockCharacter({ code: "char-2", id: "char-2", unitId: unit.id })
      await insertMockFurnitureTag({ id: "tagpriority", name: "古いタグ" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tagpriority", {
        body: JSON.stringify({
          furnitures: [
            {
              groupId: null,
              id: null,
              name: "家具A",
              reactions: [
                { characters: ["char-1"], excludeFromGroup: false, id: null },
                { characters: ["char-2"], excludeFromGroup: false, id: null },
              ],
            },
            {
              groupId: null,
              id: null,
              name: "家具B",
              reactions: [{ characters: ["char-1"], excludeFromGroup: false, id: null }],
            },
          ],
          name: "優先度更新タグ",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const updatedFurnitures = await prisma.furniture.findMany({
        include: {
          reactions: {
            orderBy: { priority: "asc" },
          },
        },
        orderBy: { priority: "asc" },
        where: { tagId: "tagpriority" },
      })

      expect(updatedFurnitures).toHaveLength(2)
      expect(updatedFurnitures[0].name).toBe("家具A")
      expect(updatedFurnitures[0].priority).toBe(0)
      expect(updatedFurnitures[1].name).toBe("家具B")
      expect(updatedFurnitures[1].priority).toBe(1)

      expect(updatedFurnitures[0].reactions).toHaveLength(2)
      expect(updatedFurnitures[0].reactions[0].priority).toBe(0)
      expect(updatedFurnitures[0].reactions[1].priority).toBe(1)
    })

    it("タグが見つからない場合は404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/unknown", {
        body: JSON.stringify({ furnitures: [], name: "更新後のタグ名" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("タグが見つかりません")
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag1", {
        body: JSON.stringify({ furnitures: [], name: "更新後のタグ名" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("認証なしでは401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag1", {
        body: JSON.stringify({ furnitures: [], name: "更新後のタグ名" }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
