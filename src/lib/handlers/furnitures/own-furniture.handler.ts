import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureParamDtoSchema } from "@/lib/schemas/dto/furniture.dto"
import type { FurnitureOwnershipResponse } from "@/lib/schemas/response/furniture.response"
import { furnitureOwnershipResponseSchema } from "@/lib/schemas/response/furniture.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { createId } from "@paralleldrive/cuid2"

export const ownFurnitureRoute = createRoute({
  description: "家具を現在のユーザーの所持済みとしてマークする",
  method: "post",
  path: "/api/furnitures/own/{furnitureId}",
  request: {
    params: furnitureParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipResponseSchema, "Furniture marked as owned"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [cookieAuth],
  summary: "家具所持登録",
  tags: [Tags.FURNITURES.name],
})

export const ownFurniture: RouteHandler<typeof ownFurnitureRoute, AppEnv> = async (c) => {
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

    // 所持状態を登録（既に存在する場合は何もしない）
    await prisma.userFurniture.upsert({
      create: {
        furnitureId,
        id: createId(),
        userId: user.id,
      },
      update: {},
      where: {
        userId_furnitureId: {
          furnitureId,
          userId: user.id,
        },
      },
    })

    const response: FurnitureOwnershipResponse = {
      data: {
        furnitureId,
        owned: true,
      },
      message: "家具を所持登録しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "所持登録に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
