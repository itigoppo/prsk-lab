import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureTagParamDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { DeleteFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { deleteFurnitureTagResponseSchema } from "@/lib/schemas/response/admin/furniture-tag.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const deleteFurnitureTagRoute = createRoute({
  description: "家具タグとそのタグに紐づくすべての家具を削除する（カスケード削除）",
  method: "delete",
  path: "/api/admin/furniture-tags/{tagId}",
  request: {
    params: furnitureTagParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, deleteFurnitureTagResponseSchema, "家具タグを削除しました"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具タグ削除",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const deleteFurnitureTag: RouteHandler<typeof deleteFurnitureTagRoute, AppEnv> = async (
  c
) => {
  try {
    const tagId = c.req.param("tagId")

    // タグの存在確認
    const existingTag = await prisma.furnitureTag.findUnique({
      select: { id: true },
      where: { id: tagId },
    })

    if (!existingTag) {
      return c.json({ message: "タグが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // タグを削除（カスケードで関連データも削除される）
    await prisma.furnitureTag.delete({
      where: { id: tagId },
    })

    const response: DeleteFurnitureTagResponse = {
      message: "タグを削除しました",
      success: true,
    }

    return c.json(response)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[deleteFurnitureTag] error:", error)
    return c.json(
      { message: "タグの削除に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
