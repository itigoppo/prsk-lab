import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { DeleteFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import type { Handler } from "hono"

export const deleteFurnitureGroup: Handler = async (c) => {
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
