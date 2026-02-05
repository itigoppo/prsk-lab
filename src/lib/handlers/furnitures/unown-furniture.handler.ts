import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { FurnitureOwnershipResponse } from "@/lib/schemas/response/furniture.response"
import type { Handler } from "hono"

export const unownFurniture: Handler = async (c) => {
  try {
    const furnitureId = c.req.param("furnitureId")
    const discordId = c.get("discordId")

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "ユーザーが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
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
