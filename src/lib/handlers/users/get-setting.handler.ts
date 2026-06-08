import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import type { CurrentSettingResponse } from "@/lib/schemas/response/user.response"
import { currentSettingResponseSchema } from "@/lib/schemas/response/user.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"

export const getSettingRoute = createRoute({
  description: "現在のユーザーの設定情報を取得する",
  method: "get",
  path: "/api/users/settings",
  responses: {
    ...jsonResponse(HTTP_STATUS.OK, currentSettingResponseSchema, "設定情報を取得しました"),
    ...commonResponses.unauthorized,
    ...commonResponses.notFound,
  },
  security: [cookieAuth],
  summary: "ユーザー設定取得",
  tags: [Tags.SETTINGS.name],
})

export const getSetting: RouteHandler<typeof getSettingRoute, AppEnv> = async (c) => {
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

    return c.json(response, HTTP_STATUS.OK)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[getSetting] error:", error)
    return c.json(
      { message: "設定情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
