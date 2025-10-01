import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { CurrentSettingResponse } from "@/lib/schemas/user"
import type { Handler } from "hono"

export const getSetting: Handler = async (c) => {
  const discordId = c.get("discordId")

  if (!discordId) {
    return c.json(
      { message: "ユーザー情報の取得に失敗しました", success: false },
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  try {
    const user = await prisma.setting.findFirst({
      select: {
        leaderSheetUrl: true,
      },
      where: {
        user: {
          discordId,
        },
      },
    })

    const response: CurrentSettingResponse = {
      data: {
        isRegistered: user !== null,
        leaderSheetUrl: user?.leaderSheetUrl ?? null,
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
