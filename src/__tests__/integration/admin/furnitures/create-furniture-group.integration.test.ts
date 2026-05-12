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
describe("POST /api/admin/furniture-groups", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/admin/furniture-groups", () => {
    it("グループを作成できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit = await insertMockUnit({ id: "unit-1" })
      await insertMockCharacter({ code: "char1", id: "char-1", unitId: unit.id })
      await insertMockCharacter({ code: "char2", id: "char-2", unitId: unit.id })

      const tag = await insertMockFurnitureTag({ id: "tag-1" })
      await prisma.furniture.create({
        data: {
          id: "furniture-1",
          name: "家具1",
          tagId: tag.id,
          updatedAt: new Date(),
        },
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        body: JSON.stringify({
          excludedCombinations: [["char-1", "char-2"]],
          furnitureIds: ["furniture-1"],
          name: "新グループ",
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

      const group = await prisma.furnitureGroup.findUnique({ where: { id: json.data.id } })
      expect(group?.name).toBe("新グループ")

      const excluded = await prisma.furnitureGroupExcludedCharacter.findMany({
        where: { groupId: json.data.id },
      })
      expect(excluded).toHaveLength(2) // char-1 and char-2 for 1 combination
    })

    it("Editor権限でもグループを作成できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        body: JSON.stringify({
          excludedCombinations: [],
          furnitureIds: [],
          name: "Editorが作成したグループ",
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

      const group = await prisma.furnitureGroup.findUnique({ where: { id: json.data.id } })
      expect(group?.name).toBe("Editorが作成したグループ")
    })

    it("組み合わせに異なるユニットのキャラクターが含まれる場合は400を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      const unit1 = await insertMockUnit({ code: "unit1", id: "unit-1" })
      const unit2 = await insertMockUnit({ code: "unit2", id: "unit-2" })
      await insertMockCharacter({ code: "char1", id: "char-1", unitId: unit1.id })
      await insertMockCharacter({ code: "char2", id: "char-2", unitId: unit2.id })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        body: JSON.stringify({
          excludedCombinations: [["char-1", "char-2"]],
          furnitureIds: [],
          name: "新グループ",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新グループ" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })
})
