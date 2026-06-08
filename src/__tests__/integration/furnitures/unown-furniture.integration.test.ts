import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  insertMockFurniture,
  insertMockFurnitureTag,
  insertMockUser,
  insertMockUserFurniture,
} from "../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("DELETE /api/furnitures/own/{furnitureId}", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("DELETE /api/furnitures/own/{furnitureId}", () => {
    it("認証済みユーザーが家具の所持を解除できる", async () => {
      const user = await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const tag = await insertMockFurnitureTag({ id: "tag-1" })
      const furniture = await insertMockFurniture(tag.id, { id: "furniture1" })
      await insertMockUserFurniture(user.id, furniture.id)

      const res = await openAPIApp.request("/api/furnitures/own/furniture1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.furnitureId).toBe("furniture1")
      expect(json.data.owned).toBe(false)
    })

    it("ユーザーが見つからない場合は401を返す", async () => {
      const res = await openAPIApp.request("/api/furnitures/own/furniture1", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("セッションが無効です")
    })

    it("家具が見つからない場合は404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })

      const res = await openAPIApp.request("/api/furnitures/own/invalidfurniture", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("家具が見つかりません")
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures/own/furniture1", {
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
