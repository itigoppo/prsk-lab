import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  insertMockCharacter,
  insertMockFurniture,
  insertMockFurnitureReaction,
  insertMockFurnitureReactionCharacter,
  insertMockFurnitureTag,
  insertMockUnit,
  insertMockUser,
} from "../../mocks/factories"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))
describe("GET /api/furnitures/{unitCode}", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/furnitures/{unitCode}", () => {
    it("認証済みユーザーが家具一覧を取得できる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const unit = await insertMockUnit({ code: "leoneed", id: "unit-1", name: "Leo/need" })
      const char = await insertMockCharacter({ id: "char-1", name: "星乃一歌", unitId: unit.id })

      const tag = await insertMockFurnitureTag({ id: "tag-1", name: "ユニットの部屋" })
      const furniture = await insertMockFurniture(tag.id, { id: "furniture-1", name: "ソファ" })
      const reaction = await insertMockFurnitureReaction(furniture.id, { id: "reaction-1" })
      await insertMockFurnitureReactionCharacter(reaction.id, char.id, { id: "rc-1" })

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.unitCode).toBe("leoneed")
      expect(json.data.unitName).toBe("Leo/need")
      expect(json.data.tags).toHaveLength(1)
    })

    it("ユーザーが見つからない場合は401を返す", async () => {
      await insertMockUnit({ code: "leoneed", id: "unit-1", name: "Leo/need" })

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("セッションが無効です")
    })

    it("認証失敗時は401を返す（Cookie なし）", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures/leoneed", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("存在しないユニットコードの場合は404を返す", async () => {
      const res = await openAPIApp.request("/api/furnitures/invalid", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユニットが見つかりません")
    })
  })
})
