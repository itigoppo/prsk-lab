import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { CreateSettingDto, createSettingDtoSchema } from "@/lib/schemas/dto/setting.dto"
import { validateCsvUrl } from "@/lib/utils/csv-validator"
import { formatZodErrors } from "@/lib/utils/zod"
import type { Handler } from "hono"

export const createSetting: Handler = async (c) => {
  const discordId = c.get("discordId")

  const body = await c.req.json()

  const parsed = createSettingDtoSchema.safeParse(body)
  if (!parsed.success) {
    const errors = formatZodErrors<CreateSettingDto>(parsed.error)
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

    // URLが設定されている場合はCSVの検証を行う
    if (leaderSheetUrl) {
      const validation = await validateCsvUrl(leaderSheetUrl)
      if (!validation.success) {
        return c.json(
          {
            message: validation.error || "URLの検証に失敗しました",
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    const user = await prisma.user.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        discordId,
      },
    })

    await prisma.setting.create({
      data: {
        leaderSheetUrl,
        userId: user.id,
      },
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
