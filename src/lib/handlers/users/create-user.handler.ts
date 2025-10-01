import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { CreateUserDto, createUserDtoSchema } from "@/lib/schemas/dto"
import { formatZodErrors } from "@/lib/schemas/utils"
import { UserRole } from "@prisma/client"
import type { Handler } from "hono"

export const createUser: Handler = async (c) => {
  const discordId = c.get("discordId")
  const discordUser = c.get("discordUser")

  // Discord APIからのユーザー情報を使用
  // avatar: ハッシュ値（CDN URLに変換が必要）
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null

  const body: CreateUserDto = {
    avatarUrl: avatarUrl ?? null,
    discordId: discordUser.id,
    email: discordUser.email ?? null,
    name: discordUser.username ?? null,
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
    const { avatarUrl: validatedAvatarUrl, email, name } = parsed.data

    const now = new Date()

    await prisma.user.upsert({
      create: {
        avatarUrl: validatedAvatarUrl,
        discordId,
        email,
        lastLoginAt: now,
        name,
        role: UserRole.Viewer,
      },
      update: {
        avatarUrl: validatedAvatarUrl,
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
