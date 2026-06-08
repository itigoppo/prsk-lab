import { FURNITURE_TAG_LIST_ORDER_BY } from "@/constants/furnitures"
import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { REORDER_DIRECTION } from "@/lib/schemas/common/reorder"
import {
  furnitureTagParamDtoSchema,
  reorderFurnitureTagDtoSchema,
} from "@/lib/schemas/dto/admin/furniture-tag.dto"
import { reorderFurnitureTagResponseSchema } from "@/lib/schemas/response/admin/furniture-tag.response"

import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import type { ReorderFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const reorderFurnitureTagsRoute = createRoute({
  description: "家具タグの優先度を指定した方向の隣接タグと入れ替える",
  method: "patch",
  path: "/api/admin/furniture-tags/{tagId}/reorder",
  request: {
    body: {
      content: {
        "application/json": {
          schema: reorderFurnitureTagDtoSchema,
        },
      },
    },
    params: furnitureTagParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, reorderFurnitureTagResponseSchema, "家具タグの順序を変更しました"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具タグ順序変更",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const reorderFurnitureTags: RouteHandler<typeof reorderFurnitureTagsRoute, AppEnv> = async (
  c
) => {
  try {
    const tagId = c.req.param("tagId")
    const { direction } = c.req.valid("json")

    // 全タグを「現在の正しい順番」で取得
    const allTags = await prisma.furnitureTag.findMany({
      orderBy: FURNITURE_TAG_LIST_ORDER_BY,
      select: { id: true, priority: true },
    })

    const currentIndex = allTags.findIndex((t) => t.id === tagId)

    if (currentIndex === -1) {
      return c.json(
        { message: "対象のタグが見つかりません", success: false },
        HTTP_STATUS.NOT_FOUND
      )
    }

    const swapIndex = direction === REORDER_DIRECTION.UP ? currentIndex - 1 : currentIndex + 1

    // 入れ替え先が範囲外（すでに一番上/下）の場合は何もしない
    if (swapIndex < 0 || swapIndex >= allTags.length) {
      const response: ReorderFurnitureTagResponse = {
        message: "並び替え順序が更新されました",
        success: true,
      }
      return c.json(response, HTTP_STATUS.OK)
    }

    // 配列上で要素を入れ替え
    const temp = allTags[currentIndex]
    allTags[currentIndex] = allTags[swapIndex]
    allTags[swapIndex] = temp

    // priority が現在のインデックスと異なるものだけを抽出して更新
    const updates = []
    for (let i = 0; i < allTags.length; i++) {
      if (allTags[i].priority !== i) {
        updates.push(
          prisma.furnitureTag.update({
            data: { priority: i },
            where: { id: allTags[i].id },
          })
        )
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    const response: ReorderFurnitureTagResponse = {
      message: "並び替え順序が更新されました",
      success: true,
    }
    return c.json(response, HTTP_STATUS.OK)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to reorder furniture tags:", error)
    return c.json(
      { message: "サーバーエラーが発生しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
