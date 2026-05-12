import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  insertMockFurniture,
  insertMockFurnitureReaction,
  insertMockFurnitureTag,
  insertMockUser,
} from "../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("POST /api/reactions/{reactionId}/check", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/reactions/{reactionId}/check", () => {
    it("認証済みユーザーがリアクションをチェックできる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const tag = await insertMockFurnitureTag({ id: "tag-1" })
      const furniture = await insertMockFurniture(tag.id, { id: "furniture-1" })
      await insertMockFurnitureReaction(furniture.id, { id: "reaction-1" })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(true)
    })

    it("ユーザーが見つからない場合は401を返す", async () => {
      const tag = await insertMockFurnitureTag({ id: "tag-1" })
      const furniture = await insertMockFurniture(tag.id, { id: "furniture-1" })
      await insertMockFurnitureReaction(furniture.id, { id: "reaction-1" })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("セッションが無効です")
    })

    it("リアクションが存在しない場合は404を返す", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })

      const res = await openAPIApp.request("/api/reactions/invalid-reaction/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
