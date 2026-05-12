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
describe("DELETE /api/admin/furniture-tags/:tagId", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("DELETE /api/admin/furniture-tags/:tagId", () => {
    it("タグを削除できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await insertMockFurnitureTag({ id: "tag-1", name: "タグ1" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("タグを削除しました")

      const tag = await prisma.furnitureTag.findUnique({ where: { id: "tag-1" } })
      expect(tag).toBeNull()
    })

    it("Editor権限でもタグを削除できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })
      await prisma.furnitureTag.create({
        data: { id: "tag-editor", name: "消すタグ", updatedAt: new Date() },
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-editor", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("タグが見つからない場合は404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/unknown-tag", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("タグが見つかりません")
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("認証なしでは401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/admin/furniture-tags/tag-1", {
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
