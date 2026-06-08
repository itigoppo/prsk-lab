import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureGroupParamDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { GetFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { getFurnitureGroupResponseSchema } from "@/lib/schemas/response/admin/furniture-group.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { Prisma } from "@prisma/client"

export const getFurnitureGroupRoute = createRoute({
  description: "除外設定および家具を含む家具グループの詳細を取得する",
  method: "get",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    params: furnitureGroupParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, getFurnitureGroupResponseSchema, "家具グループを取得しました"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具グループ詳細取得",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const getFurnitureGroup: RouteHandler<typeof getFurnitureGroupRoute, AppEnv> = async (c) => {
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
          orderBy: [{ priority: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
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
