import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { paginationQuerySchema } from "@/lib/schemas/common/pagination"
import type { GetFurnitureGroupsResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getFurnitureGroups: Handler = async (c) => {
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
        orderBy: { createdAt: Prisma.SortOrder.asc },
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
