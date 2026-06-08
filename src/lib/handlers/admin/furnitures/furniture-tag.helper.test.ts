import { prisma } from "@/lib/prisma"
import type { FurnitureWithReactionsDto } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { Character } from "@prisma/client"
import type { Context } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  prepareFurnitureTransactionData,
  validateAndGetCharacterMap,
  type CharacterMap,
} from "./furniture-tag.helper"

// Prismaをモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
  },
}))

describe("furniture-tag.helper", () => {
  describe("prepareFurnitureTransactionData", () => {
    const now = new Date("2024-01-01T00:00:00Z")

    const sortCharacterIds = vi.fn((ids: string[]) => [...ids].sort())

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("既存IDのセットがない場合、全て新規作成用の配列に入る", () => {
      const furnitures: FurnitureWithReactionsDto[] = [
        {
          groupId: "group1",
          id: null,
          name: "家具A",
          reactions: [
            {
              characters: ["char-B", "char-A"],
              excludeFromGroup: true,
              id: null,
            },
          ],
        },
      ]

      const result = prepareFurnitureTransactionData({
        existingExclusionKeys: new Map(),
        existingFurnitureIds: undefined,
        existingReactionIds: undefined,
        furnitures,
        now,
        sortCharacterIds,
        tagId: "tag1",
      })

      expect(result.furnituresData).toHaveLength(1)
      expect(result.furnitureUpdates).toHaveLength(0)

      expect(result.reactionsData).toHaveLength(1)
      expect(result.reactionUpdates).toHaveLength(0)

      expect(result.reactionCharactersData).toHaveLength(2)
      expect(result.reactionCharactersData[0].characterId).toBe("char-A")
      expect(result.reactionCharactersData[1].characterId).toBe("char-B")

      const createdAt0 = result.reactionCharactersData[0].createdAt as Date
      const createdAt1 = result.reactionCharactersData[1].createdAt as Date

      expect(createdAt0.getTime()).toBeLessThan(now.getTime())
      expect(createdAt1.getTime()).toBeGreaterThan(createdAt0.getTime())

      expect(result.exclusionData).toHaveLength(2)
    })

    it("既存IDのセットに含まれる場合、update用の配列に入る", () => {
      const furnitures: FurnitureWithReactionsDto[] = [
        {
          groupId: null,
          id: "furniture-existing",
          name: "家具B",
          reactions: [
            {
              characters: ["char-A"],
              excludeFromGroup: false,
              id: "reaction-existing",
            },
          ],
        },
      ]

      const result = prepareFurnitureTransactionData({
        existingExclusionKeys: new Map(),
        existingFurnitureIds: new Set(["furniture-existing"]),
        existingReactionIds: new Set(["reaction-existing"]),
        furnitures,
        now,
        sortCharacterIds,
        tagId: "tag1",
      })

      expect(result.furnituresData).toHaveLength(0)
      expect(result.furnitureUpdates).toHaveLength(1)
      expect(result.furnitureUpdates[0].id).toBe("furniture-existing")

      expect(result.reactionsData).toHaveLength(0)
      expect(result.reactionUpdates).toHaveLength(1)
      expect(result.reactionUpdates[0].id).toBe("reaction-existing")

      expect(result.reactionCharactersData).toHaveLength(1)
      expect(result.exclusionData).toHaveLength(0)
    })
  })

  describe("validateAndGetCharacterMap", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("キャラクターが全て存在する場合、CharacterMapを返す", async () => {
      const furnitures: FurnitureWithReactionsDto[] = [
        {
          groupId: null,
          id: null,
          name: "家具A",
          reactions: [{ characters: ["miku_1"], excludeFromGroup: false, id: null }],
        },
      ]

      // Prismaのモック返り値
      vi.mocked(prisma.character.findMany).mockResolvedValue([
        { code: "miku", id: "miku_1", priority: 1, unitId: "unit-1" } as unknown as Character,
      ])

      const mockContext = {
        json: vi.fn(),
      } as unknown as Context

      const result = await validateAndGetCharacterMap(mockContext, furnitures)

      expect(prisma.character.findMany).toHaveBeenCalledWith({
        select: { code: true, id: true, priority: true, unitId: true },
        where: { id: { in: ["miku_1"] } },
      })
      expect(result).toBeInstanceOf(Map)

      const map = result as CharacterMap
      expect(map.get("miku_1")).toMatchObject({
        isVirtualSinger: true,
        priority: 1,
        unitId: "unit-1",
      })
    })

    it("存在しないキャラクターが含まれる場合、エラーレスポンスを返す", async () => {
      const furnitures: FurnitureWithReactionsDto[] = [
        {
          groupId: null,
          id: null,
          name: "家具A",
          reactions: [{ characters: ["invalid_id"], excludeFromGroup: false, id: null }],
        },
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValue([])

      const mockResponse = {}
      const mockContext = {
        json: vi.fn().mockReturnValue(mockResponse),
      } as unknown as Context

      const result = await validateAndGetCharacterMap(mockContext, furnitures)

      expect(mockContext.json).toHaveBeenCalled()
      expect(result).toBe(mockResponse)
    })
  })
})
