import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { GetFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import type { Handler } from "hono"

export const getFurnitureGroup: Handler = async (c) => {
  try {
    const groupId = c.req.param("groupId")

    const group = await prisma.furnitureGroup.findUnique({
      include: {
        excludedCharacters: {
          include: {
            character: {
              select: { bgColor: true, color: true, id: true, short: true },
            },
          },
        },
        furnitures: {
          include: {
            tag: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      where: { id: groupId },
    })

    if (!group) {
      return c.json({ message: "グループが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // 除外組み合わせをcombinationIdでグループ化
    const combinationMap = new Map<
      string,
      { bgColor: string; color: string; id: string; short: string }[]
    >()
    for (const ec of group.excludedCharacters) {
      const existing = combinationMap.get(ec.combinationId) ?? []
      existing.push({
        bgColor: ec.character.bgColor,
        color: ec.character.color,
        id: ec.character.id,
        short: ec.character.short,
      })
      combinationMap.set(ec.combinationId, existing)
    }

    const excludedCombinations = Array.from(combinationMap.entries()).map(
      ([combinationId, characters]) => ({
        characters,
        combinationId,
      })
    )

    const response: GetFurnitureGroupResponse = {
      data: {
        group: {
          excludedCombinations,
          furnitures: group.furnitures.map((f) => ({
            id: f.id,
            name: f.name,
            tagId: f.tagId,
            tagName: f.tag.name,
          })),
          id: group.id,
          name: group.name,
        },
      },
      message: "グループを取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "グループの取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
