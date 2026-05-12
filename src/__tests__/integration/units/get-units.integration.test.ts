import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { insertMockUnit } from "../../mocks/factories"
describe("GET /api/units", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/units", () => {
    it("認証なしでユニット一覧を取得できる", async () => {
      await insertMockUnit({ code: "unit1", id: "unit1", name: "ユニット1" })
      await insertMockUnit({ code: "unit2", id: "unit2", name: "ユニット2" })

      const res = await openAPIApp.request("/api/units", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.units).toHaveLength(2)
      expect(json.data.units[0].name).toBe("ユニット1")
      expect(json.data.units[1].name).toBe("ユニット2")
    })

    it("ユニットが0件の場合は空配列を返す", async () => {
      const res = await openAPIApp.request("/api/units", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.units).toEqual([])
    })

    it("Cookieヘッダーがあっても取得できる", async () => {
      await insertMockUnit({ code: "unit1", id: "unit1", name: "ユニット1" })

      const res = await openAPIApp.request("/api/units", {
        headers: {
          Cookie: "next-auth.session-token=dummy_session_token",
        },
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.units).toHaveLength(1)
    })
  })
})
