import { FURNITURE_TAG_LIST_ORDER_BY } from "@/constants/furnitures"
import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureTagsQueryDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { GetFurnitureTagsResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { getFurnitureTagsResponseSchema } from "@/lib/schemas/response/admin/furniture-tag.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { Prisma } from "@prisma/client"

export const getFurnitureTagsRoute = createRoute({
  description: "家具のカウントを含むすべての家具タグを取得する",
  method: "get",
  path: "/api/admin/furniture-tags",
  request: {
    query: furnitureTagsQueryDtoSchema,
  },
  responses: {
    ...jsonResponse(200, getFurnitureTagsResponseSchema, "家具タグ一覧を取得しました"),
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具タグ一覧取得",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const getFurnitureTags: RouteHandler<typeof getFurnitureTagsRoute, AppEnv> = async (c) => {
  try {
    const query = c.req.valid("query")
    const limit = query.limit || 10
    const page = query.page || 1
    const searchQuery = query.q?.trim() || null

    const skip = (page - 1) * limit

    const where: Prisma.FurnitureTagWhereInput = searchQuery
      ? { name: { contains: searchQuery, mode: "insensitive" } }
      : {}

    const [tags, total] = await Promise.all([
      prisma.furnitureTag.findMany({
        include: {
          _count: {
            select: { furnitures: true },
          },
        },
        orderBy: FURNITURE_TAG_LIST_ORDER_BY,
        skip,
        take: limit,
        where,
      }),
      prisma.furnitureTag.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const response: GetFurnitureTagsResponse = {
      data: {
        pagination: {
          limit,
          page,
          total,
          totalPages,
        },
        tags: tags.map((tag) => ({
          furnitureCount: tag._count.furnitures,
          id: tag.id,
          name: tag.name,
        })),
      },
      message: "タグ一覧を取得しました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "タグ一覧の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
