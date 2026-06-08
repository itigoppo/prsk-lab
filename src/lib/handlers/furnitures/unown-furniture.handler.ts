import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureParamDtoSchema } from "@/lib/schemas/dto/furniture.dto"
import type { FurnitureOwnershipResponse } from "@/lib/schemas/response/furniture.response"
import { furnitureOwnershipResponseSchema } from "@/lib/schemas/response/furniture.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const unownFurnitureRoute = createRoute({
  description: "現在のユーザーの家具の所持状態を解除する",
  method: "delete",
  path: "/api/furnitures/own/{furnitureId}",
  request: {
    params: furnitureParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipResponseSchema, "Furniture ownership removed"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [cookieAuth],
  summary: "家具所持解除",
  tags: [Tags.FURNITURES.name],
})

export const unownFurniture: RouteHandler<typeof unownFurnitureRoute, AppEnv> = async (c) => {
  try {
    const { furnitureId } = c.req.valid("param")
    const discordId = c.get("discordId")

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "セッションが無効です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    // 家具の存在確認
    const furniture = await prisma.furniture.findUnique({
      select: { id: true },
      where: { id: furnitureId },
    })

    if (!furniture) {
      return c.json({ message: "家具が見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // 所持状態を削除（存在しなくても成功扱い）
    await prisma.userFurniture.deleteMany({
      where: {
        furnitureId,
        userId: user.id,
      },
    })

    const response: FurnitureOwnershipResponse = {
      data: {
        furnitureId,
        owned: false,
      },
      message: "家具の所持を解除しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "所持解除に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
