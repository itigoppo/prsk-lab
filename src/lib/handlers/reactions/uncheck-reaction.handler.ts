import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { ReactionCheckResponse } from "@/lib/schemas/response/reaction.response"
import type { Handler } from "hono"

export const uncheckReaction: Handler = async (c) => {
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
