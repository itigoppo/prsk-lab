import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { insertMockCharacter, insertMockUnit } from "../../mocks/factories"
describe("GET /api/characters", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/characters", () => {
    it("認証なしでキャラクター一覧を取得できる", async () => {
      const unit1 = await insertMockUnit({ code: "unit1", id: "unit-uuid-1", name: "ユニット1" })
      await insertMockCharacter({
        code: "char1",
        id: "char-uuid-1",
        name: "キャラクター1",
        short: "C1",
        unitId: unit1.id,
      })
      await insertMockCharacter({
        code: "char2",
        id: "char-uuid-2",
        name: "キャラクター2",
        short: "C2",
      })

      const res = await openAPIApp.request("/api/characters", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toHaveLength(2)
      expect(json.data.characters[0].name).toBe("キャラクター1")
      expect(json.data.characters[0].unit).toBeDefined()
      expect(json.data.characters[1].unit).toBeNull()
    })

    it("キャラクターが0件の場合は空配列を返す", async () => {
      const res = await openAPIApp.request("/api/characters", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toEqual([])
    })

    it("Cookieヘッダーがあっても取得できる", async () => {
      await insertMockCharacter({
        code: "char1",
        id: "char-uuid-1",
        name: "キャラクター1",
        short: "C1",
      })

      const res = await openAPIApp.request("/api/characters", {
        headers: {
          Cookie: "next-auth.session-token=dummy_session_token",
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toHaveLength(1)
    })
  })
})
