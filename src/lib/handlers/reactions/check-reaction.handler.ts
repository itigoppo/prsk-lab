import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, cookieAuth, jsonResponse } from "@/lib/hono/openapi-helpers"
import { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { reactionParamDtoSchema } from "@/lib/schemas/dto/reaction.dto"
import {
  reactionCheckResponseSchema,
  type ReactionCheckResponse,
} from "@/lib/schemas/response/reaction.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { createId } from "@paralleldrive/cuid2"

// route定義
export const checkReactionRoute = createRoute({
  description: "リアクションをチェック済みにする",
  method: "post",
  path: "/api/reactions/{reactionId}/check",
  request: {
    params: reactionParamDtoSchema,
  },
  responses: {
    ...jsonResponse(
      HTTP_STATUS.OK,
      reactionCheckResponseSchema,
      "リアクションをチェック済みにしました"
    ),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [cookieAuth],
  summary: "リアクションをチェック済みにする",
  tags: [Tags.REACTIONS.name],
})

// handler
export const checkReaction: RouteHandler<typeof checkReactionRoute, AppEnv> = async (c) => {
  try {
    const { reactionId } = c.req.valid("param")
    const discordId = c.get("discordId")

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "セッションが無効です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    // リアクションの存在確認
    const reaction = await prisma.furnitureReaction.findUnique({
      where: { id: reactionId },
    })

    if (!reaction) {
      return c.json(
        { message: "リアクションが見つかりません", success: false },
        HTTP_STATUS.NOT_FOUND
      )
    }

    // チェックを作成（既存の場合は無視）
    await prisma.userReactionCheck.upsert({
      create: {
        id: createId(),
        reactionId,
        userId: user.id,
      },
      update: {},
      where: {
        userId_reactionId: {
          reactionId,
          userId: user.id,
        },
      },
    })

    const response: ReactionCheckResponse = {
      data: {
        checked: true,
        reactionId,
      },
      message: "リアクションをチェックしました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "リアクションのチェックに失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
