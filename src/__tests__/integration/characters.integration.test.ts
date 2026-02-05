import { HTTP_STATUS } from "@/constants/http-status"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockCharacter, createMockUnit } from "../mocks/factories"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
  },
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"

describe("Characters Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/characters", () => {
    it("認証なしでキャラクター一覧を取得できる", async () => {
      const mockCharacters = [
        createMockCharacter({
          avatarUrl: "https://example.com/char1.png",
          code: "char1",
          id: "char-uuid-1",
          name: "キャラクター1",
          short: "C1",
          unit: createMockUnit(),
          unitId: "unit-uuid-1",
        }),
        createMockCharacter({
          avatarUrl: "https://example.com/char2.png",
          bgColor: "#00FF00",
          code: "char2",
          color: "#00FF00",
          id: "char-uuid-2",
          name: "キャラクター2",
          short: "C2",
        }),
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValueOnce(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

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
      vi.mocked(prisma.character.findMany).mockResolvedValueOnce([])

      const res = await openAPIApp.request("/api/characters", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.character.findMany).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/characters", {
        method: "GET",
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("Authorizationヘッダーがあっても取得できる", async () => {
      const mockCharacters = [
        createMockCharacter({
          id: "char-uuid-1",
          name: "キャラクター1",
          short: "C1",
        }),
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValueOnce(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      const res = await openAPIApp.request("/api/characters", {
        headers: {
          Authorization: "Bearer some_token",
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
