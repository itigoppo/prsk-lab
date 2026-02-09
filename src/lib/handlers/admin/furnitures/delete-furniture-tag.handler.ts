import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { DeleteFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import type { Handler } from "hono"

export const deleteFurnitureTag: Handler = async (c) => {
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
  } catch {
    return c.json(
      { message: "タグの削除に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
