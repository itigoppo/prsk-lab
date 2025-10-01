import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { UpdateSettingDto, updateSettingDtoSchema } from "@/lib/schemas/dto"
import { formatZodErrors } from "@/lib/schemas/utils"
import type { Handler } from "hono"

export const updateSetting: Handler = async (c) => {
  const discordId = c.get("discordId")

  const body = await c.req.json()

  const parsed = updateSettingDtoSchema.safeParse(body)
  if (!parsed.success) {
    const errors = formatZodErrors<UpdateSettingDto>(parsed.error)
    return c.json(
      {
        errors,
        message: "入力内容に誤りがあります",
        success: false,
      },
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const { leaderSheetUrl } = parsed.data

    const user = await prisma.user.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        discordId,
      },
    })

    await prisma.setting.update({
      data: {
        leaderSheetUrl,
      },
      where: { userId: user.id },
    })

    return c.json({
      message: "設定情報を更新しました",
      success: true,
    })
  } catch {
    return c.json(
      { message: "更新中にエラーが発生しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
