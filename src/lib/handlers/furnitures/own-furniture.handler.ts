import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { FurnitureOwnershipResponse } from "@/lib/schemas/response/furniture.response"
import { createId } from "@paralleldrive/cuid2"
import type { Handler } from "hono"

export const ownFurniture: Handler = async (c) => {
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
