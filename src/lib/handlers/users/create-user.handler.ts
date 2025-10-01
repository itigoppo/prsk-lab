import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { CreateUserDto, createUserDtoSchema } from "@/lib/schemas/dto"
import { formatZodErrors } from "@/lib/schemas/utils"
import { UserRole } from "@prisma/client"
import type { Handler } from "hono"

export const createUser: Handler = async (c) => {
  const discordId = c.get("discordId")
  const discordUser = c.get("discordUser")
  const body: CreateUserDto = {
    avatarUrl: discordUser.avatar,
    discordId: discordUser.id,
    email: discordUser.email,
    name: discordUser.username,
  }

  const parsed = createUserDtoSchema.safeParse(body)
  if (!parsed.success) {
    const errors = formatZodErrors<CreateUserDto>(parsed.error)
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
    const { avatarUrl, email, name } = parsed.data

    const now = new Date()

    await prisma.user.upsert({
      create: {
        avatarUrl,
        discordId,
        email,
        lastLoginAt: now,
        name,
        role: UserRole.Viewer,
      },
      update: {
        avatarUrl,
        email,
        lastLoginAt: now,
        name,
      },
      where: { discordId },
    })

    return c.json({
      message: "ユーザー登録が完了しました",
      success: true,
    })
  } catch {
    return c.json(
      { message: "登録中にエラーが発生しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
