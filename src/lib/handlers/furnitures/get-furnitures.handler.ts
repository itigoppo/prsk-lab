import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type {
  FurnitureOwnershipItem,
  FurnitureOwnershipListResponse,
  FurnitureOwnershipTag,
} from "@/lib/schemas/response/furniture.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getFurnitures: Handler = async (c) => {
  try {
    const discordId = c.get("discordId")
    const searchQuery = c.req.query("q")

    // ユーザーの所持家具IDを取得
    const user = await prisma.user.findUnique({
      select: {
        ownedFurnitures: {
          select: { furnitureId: true },
        },
      },
      where: { discordId },
    })
    const ownedFurnitureIds = new Set(user?.ownedFurnitures.map((f) => f.furnitureId) ?? [])

    // 全タグと家具を取得
    const tags = await prisma.furnitureTag.findMany({
      orderBy: { createdAt: Prisma.SortOrder.asc },
      select: {
        furnitures: {
          orderBy: { createdAt: Prisma.SortOrder.asc },
          select: {
            id: true,
            name: true,
          },
          where: searchQuery
            ? {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              }
            : undefined,
        },
        id: true,
        name: true,
      },
    })

    // レスポンス形式に変換（家具がないタグは除外）
    const responseTags: FurnitureOwnershipTag[] = tags
      .filter((tag) => tag.furnitures.length > 0)
      .map((tag) => ({
        furnitures: tag.furnitures.map(
          (f): FurnitureOwnershipItem => ({
            id: f.id,
            name: f.name,
            owned: ownedFurnitureIds.has(f.id),
          })
        ),
        id: tag.id,
        name: tag.name,
      }))

    const response: FurnitureOwnershipListResponse = {
      data: {
        tags: responseTags,
      },
      message: "家具一覧を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "家具一覧の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
