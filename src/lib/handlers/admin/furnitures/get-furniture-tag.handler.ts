import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { GetFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getFurnitureTag: Handler = async (c) => {
  try {
    const tagId = c.req.param("tagId")

    const tag = await prisma.furnitureTag.findUnique({
      include: {
        furnitures: {
          include: {
            group: { select: { name: true } },
            reactions: {
              include: {
                characters: {
                  include: {
                    character: {
                      select: { bgColor: true, color: true, id: true, short: true },
                    },
                  },
                  orderBy: { createdAt: Prisma.SortOrder.asc },
                },
              },
              orderBy: { createdAt: Prisma.SortOrder.asc },
            },
          },
          orderBy: { createdAt: Prisma.SortOrder.asc },
        },
      },
      where: { id: tagId },
    })

    if (!tag) {
      return c.json({ message: "タグが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // グループIDを収集して除外組み合わせを一括取得
    const groupIds = tag.furnitures.map((f) => f.groupId).filter((id): id is string => id != null)
    const excludedByGroup = new Map<string, Set<string>>()

    if (groupIds.length > 0) {
      const excludedCharacters = await prisma.furnitureGroupExcludedCharacter.findMany({
        select: { characterId: true, combinationId: true, groupId: true },
        where: { groupId: { in: groupIds } },
      })

      // groupId → combinationId → characterIds のマップを構築
      const combinationMap = new Map<string, Map<string, string[]>>()
      for (const ec of excludedCharacters) {
        if (!combinationMap.has(ec.groupId)) {
          combinationMap.set(ec.groupId, new Map())
        }
        const groupMap = combinationMap.get(ec.groupId)!
        const existing = groupMap.get(ec.combinationId) ?? []
        existing.push(ec.characterId)
        groupMap.set(ec.combinationId, existing)
      }

      // groupId → Set<combinationKey> に変換
      for (const [groupId, combMap] of combinationMap.entries()) {
        const keys = new Set<string>()
        for (const charIds of combMap.values()) {
          keys.add(charIds.sort().join(","))
        }
        excludedByGroup.set(groupId, keys)
      }
    }

    const response: GetFurnitureTagResponse = {
      data: {
        tag: {
          createdAt: tag.createdAt.toISOString(),
          furnitures: tag.furnitures.map((f) => {
            const excludedCombinations = f.groupId ? excludedByGroup.get(f.groupId) : undefined

            return {
              groupId: f.groupId,
              groupName: f.group?.name ?? null,
              id: f.id,
              name: f.name,
              reactions: f.reactions.map((r) => {
                const reactionKey = r.characters
                  .map((rc) => rc.character.id)
                  .sort()
                  .join(",")

                return {
                  characters: r.characters.map((rc) => ({
                    bgColor: rc.character.bgColor,
                    color: rc.character.color,
                    id: rc.character.id,
                    short: rc.character.short,
                  })),
                  excludeFromGroup: excludedCombinations?.has(reactionKey) ?? false,
                  id: r.id,
                }
              }),
            }
          }),
          id: tag.id,
          name: tag.name,
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
      message: "タグを取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "タグの取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
