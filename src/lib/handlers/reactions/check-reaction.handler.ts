import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { ReactionCheckResponse } from "@/lib/schemas/response/reaction.response"
import { createId } from "@paralleldrive/cuid2"
import type { Handler } from "hono"

export const checkReaction: Handler = async (c) => {
  try {
    const reactionId = c.req.param("reactionId")
    const discordId = c.get("discordId")

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "ユーザーが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
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
