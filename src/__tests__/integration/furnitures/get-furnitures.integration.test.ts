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
describe("GET /api/furnitures", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("GET /api/furnitures", () => {
    it("認証済みユーザーが家具一覧を取得できる", async () => {
      const user = await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const tag = await insertMockFurnitureTag({ id: "tag-1", name: "リビング" })
      await insertMockFurniture(tag.id, { id: "furniture-1", name: "ソファ" })
      await insertMockFurniture(tag.id, { id: "furniture-2", name: "テーブル" })

      // furniture-1 だけ所持している状態
      await insertMockUserFurniture(user.id, "furniture-1")

      const res = await openAPIApp.request("/api/furnitures", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(2)

      const f1 = json.data.tags[0].furnitures.find((f: { id: string }) => f.id === "furniture-1")
      const f2 = json.data.tags[0].furnitures.find((f: { id: string }) => f.id === "furniture-2")
      expect(f1.owned).toBe(true)
      expect(f2.owned).toBe(false)
    })

    it("検索クエリで家具をフィルタリングできる", async () => {
      await insertMockUser({ discordId: MOCK_DISCORD_ID })
      const tag = await insertMockFurnitureTag({ id: "tag-1", name: "リビング" })
      await insertMockFurniture(tag.id, { id: "furniture-1", name: "ソファ" })
      await insertMockFurniture(tag.id, { id: "furniture-2", name: "イス" }) // 検索対象外

      const res = await openAPIApp.request("/api/furnitures?q=ソファ", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
    })

    it("ユーザーが見つからない場合は401を返す", async () => {
      const res = await openAPIApp.request("/api/furnitures", {
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

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/furnitures", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
