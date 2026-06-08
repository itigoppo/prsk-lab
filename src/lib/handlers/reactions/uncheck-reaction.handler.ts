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

// route定義
export const uncheckReactionRoute = createRoute({
  description: "リアクションのチェックを外す",
  method: "delete",
  path: "/api/reactions/{reactionId}/check",
  request: {
    params: reactionParamDtoSchema,
  },
  responses: {
    ...jsonResponse(
      HTTP_STATUS.OK,
      reactionCheckResponseSchema,
      "リアクションのチェックを外しました"
    ),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [cookieAuth],
  summary: "リアクションのチェックを外す",
  tags: [Tags.REACTIONS.name],
})

// handler
export const uncheckReaction: RouteHandler<typeof uncheckReactionRoute, AppEnv> = async (c) => {
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
      select: { id: true },
      where: { id: reactionId },
    })

    if (!reaction) {
      return c.json(
        { message: "リアクションが見つかりません", success: false },
        HTTP_STATUS.NOT_FOUND
      )
    }

    // チェックを削除（存在しない場合も成功扱い）
    await prisma.userReactionCheck.deleteMany({
      where: {
        reactionId,
        userId: user.id,
      },
    })

    const response: ReactionCheckResponse = {
      data: {
        checked: false,
        reactionId,
      },
      message: "リアクションのチェックを解除しました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "リアクションのチェック解除に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
