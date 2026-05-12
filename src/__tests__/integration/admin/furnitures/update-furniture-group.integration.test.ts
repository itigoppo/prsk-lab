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
describe("PATCH /api/admin/furniture-groups/:groupId", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("PATCH /api/admin/furniture-groups/:groupId", () => {
    it("グループを更新できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const group = await prisma.furnitureGroup.create({
        data: {
          id: "group-1",
          name: "古いグループ名",
          updatedAt: new Date(),
        },
      })

      const unit = await insertMockUnit({ id: "unit-1" })
      await insertMockCharacter({ code: "char1", id: "char-1", unitId: unit.id })
      await insertMockCharacter({ code: "char2", id: "char-2", unitId: unit.id })
      const tag = await insertMockFurnitureTag({ id: "tag-1" })
      await prisma.furniture.create({
        data: {
          groupId: group.id,
          id: "furniture-1",
          name: "家具1",
          tagId: tag.id,
          updatedAt: new Date(),
        },
      })
      await prisma.furniture.create({
        data: {
          groupId: group.id,
          id: "furniture-2",
          name: "家具2",
          tagId: tag.id,
          updatedAt: new Date(),
        },
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        body: JSON.stringify({
          excludedCombinations: [["char-1", "char-2"]],
          furnitureIds: ["furniture-1"], // 2を外して1のみにする
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

      const updatedGroup = await prisma.furnitureGroup.findUnique({ where: { id: "group-1" } })
      expect(updatedGroup?.name).toBe("更新後のグループ名")

      const furnitures = await prisma.furniture.findMany({ where: { groupId: "group-1" } })
      expect(furnitures).toHaveLength(1)
      expect(furnitures[0].id).toBe("furniture-1")
    })

    it("Editor権限でもグループを更新できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })
      await prisma.furnitureGroup.create({
        data: { id: "group-editor", name: "古い", updatedAt: new Date() },
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-editor", {
        body: JSON.stringify({
          excludedCombinations: [],
          furnitureIds: [],
          name: "更新されたEditorグループ",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("グループが見つからない場合は404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-groups/unknown", {
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

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it("組み合わせに異なるユニットのキャラクターが含まれる場合は400を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await prisma.furnitureGroup.create({
        data: { id: "group-1", name: "グループ", updatedAt: new Date() },
      })
      const unit1 = await insertMockUnit({ code: "unit1", id: "unit-1" })
      const unit2 = await insertMockUnit({ code: "unit2", id: "unit-2" })
      await insertMockCharacter({ code: "char1", id: "char-1", unitId: unit1.id })
      await insertMockCharacter({ code: "char2", id: "char-2", unitId: unit2.id })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        body: JSON.stringify({
          excludedCombinations: [["char-1", "char-2"]],
          furnitureIds: [],
          name: "更新後のグループ名",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

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

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("認証なしでは401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        body: JSON.stringify({
          excludedCombinations: [],
          furnitureIds: [],
          name: "更新後のグループ名",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
