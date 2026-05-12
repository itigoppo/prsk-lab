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
describe("GET /api/admin/furniture-groups/:groupId", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/admin/furniture-groups/:groupId", () => {
    it("グループ詳細を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })
      await prisma.furnitureGroup.create({
        data: {
          id: "group-1",
          name: "テストグループ",
          updatedAt: new Date(),
        },
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.group.id).toBe("group-1")
    })

    it("Editor権限でもグループ詳細を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Editor" })
      await prisma.furnitureGroup.create({
        data: { id: "group-editor", name: "詳細取得", updatedAt: new Date() },
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-editor", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("存在しないグループIDでは404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Admin" })

      const res = await openAPIApp.request("/api/admin/furniture-groups/unknown", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID, role: "Viewer" })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("認証なしでは401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/admin/furniture-groups/group-1", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
