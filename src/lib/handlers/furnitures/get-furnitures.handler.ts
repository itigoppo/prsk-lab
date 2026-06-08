import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureSearchQueryDtoSchema } from "@/lib/schemas/dto/furniture.dto"
import type {
  FurnitureOwnershipItem,
  FurnitureOwnershipListResponse,
  FurnitureOwnershipTag,
} from "@/lib/schemas/response/furniture.response"
import { furnitureOwnershipListResponseSchema } from "@/lib/schemas/response/furniture.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { Prisma } from "@prisma/client"

export const getFurnituresRoute = createRoute({
  description: "現在のユーザーの所持状態を含むすべての家具を取得する",
  method: "get",
  path: "/api/furnitures",
  request: {
    query: furnitureSearchQueryDtoSchema,
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipListResponseSchema, "家具一覧を取得しました"),
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [cookieAuth],
  summary: "全家具一覧取得",
  tags: [Tags.FURNITURES.name],
})

export const getFurnitures: RouteHandler<typeof getFurnituresRoute, AppEnv> = async (c) => {
  try {
    const discordId = c.get("discordId")
    const { q: searchQuery } = c.req.valid("query")

    // ユーザーの所持家具IDを取得
    const user = await prisma.user.findUnique({
      select: {
        ownedFurnitures: {
          select: { furnitureId: true },
        },
      },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "セッションが無効です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    const ownedFurnitureIds = new Set(user.ownedFurnitures.map((f) => f.furnitureId))

    // 全タグと家具を取得
    const tags = await prisma.furnitureTag.findMany({
      orderBy: [{ priority: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
      select: {
        furnitures: {
          orderBy: [{ priority: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
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
