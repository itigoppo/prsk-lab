import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { CurrentSettingResponse } from "@/lib/schemas/response/user.response"
import type { Handler } from "hono"

export const getSetting: Handler = async (c) => {
  const discordId = c.get("discordId")

  try {
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "セッションが無効です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    const setting = await prisma.setting.findUnique({
      select: {
        leaderSheetUrl: true,
      },
      where: {
        userId: user.id,
      },
    })

    const response: CurrentSettingResponse = {
      data: {
        isRegistered: setting !== null,
        leaderSheetUrl: setting?.leaderSheetUrl ?? null,
      },
      message: "設定情報を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "設定情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
