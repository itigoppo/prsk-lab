import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { CurrentUserResponse } from "@/lib/schemas/response/user.response"
import type { Handler } from "hono"

export const getCurrentUser: Handler = async (c) => {
  const discordId = c.get("discordId")

  try {
    const user = await prisma.user.findUnique({
      select: {
        avatarUrl: true,
        discordId: true,
        email: true,
        id: true,
        name: true,
        role: true,
      },
      where: {
        discordId,
      },
    })

    if (!user) {
      return c.json({ message: "セッションが無効です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    const response: CurrentUserResponse = {
      data: {
        avatarUrl: user.avatarUrl,
        discordId: user.discordId,
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
      },
      message: "ユーザー情報を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "ユーザー情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
