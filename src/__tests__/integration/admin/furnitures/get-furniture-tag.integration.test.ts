import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockFurnitureTag, insertMockUser } from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/admin/furniture-tags/:tagId", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/admin/furniture-tags/:tagId", () => {
    it("タグ詳細を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await insertMockFurnitureTag({
        id: "tag-1",
        name: "タグ1",
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.tag.id).toBe("tag-1")
    })

    it("Editor権限でもタグ詳細を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })
      await prisma.furnitureTag.create({
        data: { id: "tag-editor", name: "Editorタグ", updatedAt: new Date() },
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-editor", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("存在しないタグIDでは404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/unknown", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
