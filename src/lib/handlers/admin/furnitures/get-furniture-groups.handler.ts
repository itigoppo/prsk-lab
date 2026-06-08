import { FURNITURE_GROUP_LIST_ORDER_BY } from "@/constants/furnitures"
import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { paginationQuerySchema } from "@/lib/schemas/common/pagination"
import { furnitureGroupsQueryDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { GetFurnitureGroupsResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { getFurnitureGroupsResponseSchema } from "@/lib/schemas/response/admin/furniture-group.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const getFurnitureGroupsRoute = createRoute({
  description: "すべての家具グループを取得する",
  method: "get",
  path: "/api/admin/furniture-groups",
  request: {
    query: furnitureGroupsQueryDtoSchema,
  },
  responses: {
    ...jsonResponse(200, getFurnitureGroupsResponseSchema, "家具グループ一覧を取得しました"),
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具グループ一覧取得",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const getFurnitureGroups: RouteHandler<typeof getFurnitureGroupsRoute, AppEnv> = async (
  c
) => {
  try {
    const query = c.req.query()
    const { limit, page } = paginationQuerySchema.parse({
      limit: query.limit,
      page: query.page,
    })

    const skip = (page - 1) * limit

    const [groups, total] = await Promise.all([
      prisma.furnitureGroup.findMany({
        include: {
          _count: {
            select: { furnitures: true },
          },
          excludedCharacters: {
            select: { combinationId: true },
          },
        },
        orderBy: FURNITURE_GROUP_LIST_ORDER_BY,
        skip,
        take: limit,
      }),
      prisma.furnitureGroup.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    const response: GetFurnitureGroupsResponse = {
      data: {
        groups: groups.map((group) => {
          // 除外組み合わせ数をユニークなcombinationIdでカウント
          const uniqueCombinations = new Set(group.excludedCharacters.map((ec) => ec.combinationId))
          return {
            excludedCombinationCount: uniqueCombinations.size,
            furnitureCount: group._count.furnitures,
            id: group.id,
            name: group.name,
          }
        }),
        pagination: {
          limit,
          page,
          total,
          totalPages,
        },
      },
      message: "グループ一覧を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "グループ一覧の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
