import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockCharacter, insertMockUnit, insertMockUser } from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("POST /api/admin/furniture-tags", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/admin/furniture-tags", () => {
    it("タグを作成できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({ furnitures: [], name: "新タグ" }),
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

      // DBで実際に作成されているか確認
      const createdTag = await prisma.furnitureTag.findUnique({
        where: { id: json.data.id },
      })
      expect(createdTag).not.toBeNull()
      expect(createdTag?.name).toBe("新タグ")
    })

    it("Editor権限でもタグを作成できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({ furnitures: [], name: "Editorタグ" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = await res.json()
      expect(json.success).toBe(true)

      const createdTag = await prisma.furnitureTag.findUnique({
        where: { id: json.data.id },
      })
      expect(createdTag?.name).toBe("Editorタグ")
    })

    it("タグと家具を一括作成できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit = await insertMockUnit({ id: "unit-1" })
      await insertMockCharacter({ id: "char-1", unitId: unit.id })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({
          furnitures: [
            {
              groupId: null,
              id: null,
              name: "家具1",
              reactions: [{ characters: ["char-1"], excludeFromGroup: false, id: null }],
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

      // DBで作成されているか確認
      const furnitures = await prisma.furniture.findMany({
        include: { reactions: { include: { characters: true } } },
        where: { tagId: json.data.id },
      })
      expect(furnitures).toHaveLength(1)
      expect(furnitures[0].name).toBe("家具1")
      expect(furnitures[0].reactions).toHaveLength(1)
      expect(furnitures[0].reactions[0].characters[0].characterId).toBe("char-1")
    })

    it("家具とリアクションのpriorityが配列のインデックス順に設定される", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit = await insertMockUnit({ id: "unit-1" })
      await insertMockCharacter({ code: "char-1", id: "char-1", unitId: unit.id })
      await insertMockCharacter({ code: "char-2", id: "char-2", unitId: unit.id })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
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
          name: "優先度テストタグ",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = await res.json()

      const createdFurnitures = await prisma.furniture.findMany({
        include: {
          reactions: {
            orderBy: { priority: "asc" },
          },
        },
        orderBy: { priority: "asc" },
        where: { tagId: json.data.id },
      })

      expect(createdFurnitures).toHaveLength(2)
      expect(createdFurnitures[0].name).toBe("家具A")
      expect(createdFurnitures[0].priority).toBe(0)
      expect(createdFurnitures[1].name).toBe("家具B")
      expect(createdFurnitures[1].priority).toBe(1)

      expect(createdFurnitures[0].reactions).toHaveLength(2)
      expect(createdFurnitures[0].reactions[0].priority).toBe(0)
      expect(createdFurnitures[0].reactions[1].priority).toBe(1)
    })

    it("リアクションが異なるユニットのキャラクターを含む場合はエラーになる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit1 = await insertMockUnit({ code: "unit1", id: "unit-1" })
      const unit2 = await insertMockUnit({ code: "unit2", id: "unit-2" })
      await insertMockCharacter({ code: "char-1", id: "char-1", unitId: unit1.id })
      await insertMockCharacter({ code: "char-2", id: "char-2", unitId: unit2.id })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({
          furnitures: [
            {
              groupId: null,
              id: null,
              name: "家具1",
              reactions: [{ characters: ["char-1", "char-2"], excludeFromGroup: false, id: null }],
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

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユニットをまたいだリアクションは作成できません")
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({ furnitures: [], name: "新タグ" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("furnituresが省略された場合は400を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({ name: "家具省略タグ" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("入力内容に誤りがあります")
    })

    it("nameが省略された場合は400を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        body: JSON.stringify({ furnitures: [] }), // name なし
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("入力内容に誤りがあります")
    })
  })
})
