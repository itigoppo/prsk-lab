import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { paginationQuerySchema } from "@/lib/schemas/common/pagination"
import type { GetFurnitureTagsResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getFurnitureTags: Handler = async (c) => {
  try {
    const query = c.req.query()
    const { limit, page } = paginationQuerySchema.parse({
      limit: query.limit,
      page: query.page,
    })
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
        orderBy: { createdAt: Prisma.SortOrder.asc },
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

    return c.json(response)
  } catch {
    return c.json(
      { message: "タグ一覧の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
