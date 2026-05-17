import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockFurnitureTag, insertMockUser } from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/admin/furniture-tags", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/admin/furniture-tags", () => {
    it("Admin権限でタグ一覧を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await insertMockFurnitureTag({ id: "tag-1", name: "タグ1" })
      await insertMockFurnitureTag({ id: "tag-2", name: "タグ2" })

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

    it("優先度(priority)の昇順でタグ一覧が取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await insertMockFurnitureTag({ id: "tag-priority-1", name: "優先度2のタグ", priority: 2 })
      await insertMockFurnitureTag({ id: "tag-priority-2", name: "優先度1のタグ", priority: 1 })
      await insertMockFurnitureTag({ id: "tag-priority-3", name: "優先度3のタグ", priority: 3 })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = await res.json()
      expect(json.success).toBe(true)

      const tags = json.data.tags
      expect(tags).toHaveLength(3)
      expect(tags[0].name).toBe("優先度1のタグ")
      expect(tags[1].name).toBe("優先度2のタグ")
      expect(tags[2].name).toBe("優先度3のタグ")
    })

    it("Editor権限でもタグ一覧を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })

      const res = await openAPIApp.request("/api/admin/furniture-tags", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

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
})
