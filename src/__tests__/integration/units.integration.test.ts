import { HTTP_STATUS } from "@/constants/http-status"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockUnit } from "../mocks/factories"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
  },
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"

describe("Units Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/units", () => {
    it("認証なしでユニット一覧を取得できる", async () => {
      const mockUnits = [
        createMockUnit({
          code: "unit1",
          name: "ユニット1",
        }),
        createMockUnit({
          code: "unit2",
          name: "ユニット2",
        }),
      ]

      vi.mocked(prisma.unit.findMany).mockResolvedValueOnce(
        mockUnits as unknown as Awaited<ReturnType<typeof prisma.unit.findMany>>
      )

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
      vi.mocked(prisma.unit.findMany).mockResolvedValueOnce([])

      const res = await openAPIApp.request("/api/units", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.units).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.unit.findMany).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/units", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("Authorizationヘッダーがあっても取得できる", async () => {
      const mockUnits = [
        createMockUnit({
          code: "unit1",
          name: "ユニット1",
        }),
      ]

      vi.mocked(prisma.unit.findMany).mockResolvedValueOnce(
        mockUnits as unknown as Awaited<ReturnType<typeof prisma.unit.findMany>>
      )

      const res = await openAPIApp.request("/api/units", {
        headers: {
          Authorization: "Bearer some_token",
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
