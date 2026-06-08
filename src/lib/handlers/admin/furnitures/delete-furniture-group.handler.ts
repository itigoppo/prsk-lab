import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { furnitureGroupParamDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { DeleteFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { deleteFurnitureGroupResponseSchema } from "@/lib/schemas/response/admin/furniture-group.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const deleteFurnitureGroupRoute = createRoute({
  description: "家具グループを削除する（家具のgroupIdはnullに設定されます）",
  method: "delete",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    params: furnitureGroupParamDtoSchema,
  },
  responses: {
    ...jsonResponse(200, deleteFurnitureGroupResponseSchema, "家具グループを削除しました"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具グループ削除",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const deleteFurnitureGroup: RouteHandler<typeof deleteFurnitureGroupRoute, AppEnv> = async (
  c
) => {
  try {
    const groupId = c.req.param("groupId")

    // グループの存在確認
    const existingGroup = await prisma.furnitureGroup.findUnique({
      select: { id: true },
      where: { id: groupId },
    })

    if (!existingGroup) {
      return c.json({ message: "グループが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // グループを削除（カスケードで除外キャラクター情報も削除される）
    // 関連する家具のgroupIdはnullになる（onDelete: SetNull）
    await prisma.furnitureGroup.delete({
      where: { id: groupId },
    })

    const response: DeleteFurnitureGroupResponse = {
      message: "グループを削除しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "グループの削除に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
