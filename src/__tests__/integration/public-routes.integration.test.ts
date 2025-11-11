import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockCharacter, createMockUnit, createVirtualSingerUnit } from "../mocks/factories"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("Public Routes Integration Tests", () => {
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

      const res = await openAPIApp.request("/api/characters")

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

      const res = await openAPIApp.request("/api/characters")

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.character.findMany).mockRejectedValueOnce(new Error("Database error"))

      const res = await openAPIApp.request("/api/characters")

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it("バーチャルシンガーを正しく判定する", async () => {
      const mockCharacters = [
        createMockCharacter({
          avatarUrl: "https://example.com/vs1.png",
          bgColor: "#FF00FF",
          code: "miku",
          color: "#FF00FF",
          id: "char-uuid-miku",
          name: "初音ミク",
          short: "MIKU",
          unit: createVirtualSingerUnit(),
          unitId: "unit-uuid-vs",
        }),
        createMockCharacter({
          avatarUrl: "https://example.com/normal.png",
          bgColor: "#00FFFF",
          code: "normal",
          color: "#00FFFF",
          id: "char-uuid-normal",
          name: "通常キャラ",
          short: "NORMAL",
          unit: createMockUnit(),
          unitId: "unit-uuid-1",
        }),
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValueOnce(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      const res = await openAPIApp.request("/api/characters")

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.data.characters[0].isVirtualSinger).toBe(true)
      expect(json.data.characters[1].isVirtualSinger).toBe(false)
    })

    it("unitがnullのキャラクターも正しく処理できる", async () => {
      const mockCharacters = [
        createMockCharacter({
          avatarUrl: "https://example.com/char.png",
          bgColor: "#ABCDEF",
          code: "char",
          color: "#ABCDEF",
          id: "char-uuid-no-unit",
          name: "ユニットなしキャラ",
          short: "CHAR",
        }),
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValueOnce(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      const res = await openAPIApp.request("/api/characters")

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.data.characters[0].isVirtualSinger).toBe(false)
      expect(json.data.characters[0].unit).toBeNull()
    })
  })

  describe("認証不要のエンドポイントで認証ヘッダーがあっても動作する", () => {
    it("Authorizationヘッダーがあってもキャラクター一覧を取得できる", async () => {
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
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.characters).toHaveLength(1)
    })
  })

  describe("大量のキャラクターデータの処理", () => {
    it("100件のキャラクターを正しく処理できる", async () => {
      const mockCharacters = Array.from({ length: 100 }, (_, i) =>
        createMockCharacter({
          avatarUrl: `https://example.com/char${i}.png`,
          bgColor: "#FFFFFF",
          code: `char${i}`,
          color: "#FFFFFF",
          id: `char-uuid-${i}`,
          name: `キャラクター${i}`,
          short: `C${i}`,
          unit:
            i % 2 === 0
              ? null
              : { bgColor: "#FFFF00", code: "vs", color: "#FFFF00", id: "vs-id", name: "VS" },
          unitId: i % 2 === 0 ? null : "vs-id",
        })
      )

      vi.mocked(prisma.character.findMany).mockResolvedValueOnce(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      const res = await openAPIApp.request("/api/characters")

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.data.characters).toHaveLength(100)
    })
  })
})
