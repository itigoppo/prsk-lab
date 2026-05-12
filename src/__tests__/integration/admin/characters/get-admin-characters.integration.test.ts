import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { insertMockCharacter, insertMockUnit, insertMockUser } from "../../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/admin/furniture-characters", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/admin/furniture-characters", () => {
    it("Admin権限でキャラクター一覧を取得できる", async () => {
      await insertMockUser({
        discordId: MOCK_DISCORD_ID,
        role: "Admin",
      })

      const unit = await insertMockUnit({ code: "leoneed", id: "unit1", name: "Leo/need" })
      await insertMockCharacter({
        code: "leoneed_ichika",
        id: "char-1",
        name: "星乃一歌",
        unitId: unit.id,
      })

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
      await insertMockUser({
        discordId: MOCK_DISCORD_ID,
        role: "Editor",
      })

      const res = await openAPIApp.request("/api/admin/furniture-characters", {
        headers: { Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}` },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it("Viewer権限では403を返す", async () => {
      await insertMockUser({
        discordId: MOCK_DISCORD_ID,
        role: "Viewer",
      })

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
