import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import type { CurrentUserResponse } from "@/lib/schemas/response/user.response"
import { currentUserResponseSchema } from "@/lib/schemas/response/user.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const getCurrentUserRoute = createRoute({
  description: "現在のユーザー情報を取得する",
  method: "get",
  path: "/api/users/me",
  responses: {
    ...jsonResponse(HTTP_STATUS.OK, currentUserResponseSchema, "ユーザー情報を取得しました"),
    ...commonResponses.unauthorized,
    ...commonResponses.notFound,
  },
  security: [cookieAuth],
  summary: "現在のユーザー取得",
  tags: [Tags.USERS.name],
})

export const getCurrentUser: RouteHandler<typeof getCurrentUserRoute, AppEnv> = async (c) => {
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

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "ユーザー情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
