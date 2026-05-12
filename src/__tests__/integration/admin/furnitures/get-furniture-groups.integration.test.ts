import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockUser } from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/admin/furniture-groups", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/admin/furniture-groups", () => {
    it("Admin権限でグループ一覧を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await prisma.furnitureGroup.create({
        data: {
          id: "group-1",
          name: "グループ1",
          updatedAt: new Date(),
        },
      })

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

    it("Editor権限でもグループ一覧を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("認証なしでは401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
