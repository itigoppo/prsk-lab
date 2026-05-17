import { FURNITURE_GROUP_LIST_ORDER_BY } from "@/constants/furnitures"
import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { REORDER_DIRECTION } from "@/lib/schemas/common/reorder"
import { reorderFurnitureGroupDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { ReorderFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { formatZodErrors } from "@/lib/utils/zod"
import type { Handler } from "hono"

export const reorderFurnitureGroups: Handler = async (c) => {
  try {
    const groupId = c.req.param("groupId")
    const body = await c.req.json()
    const parsed = reorderFurnitureGroupDtoSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        {
          errors: formatZodErrors(parsed.error),
          message: "入力内容に誤りがあります",
          success: false,
        },
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const { direction } = parsed.data

    // 全グループを「現在の正しい順番」で取得
    const allGroups = await prisma.furnitureGroup.findMany({
      orderBy: FURNITURE_GROUP_LIST_ORDER_BY,
      select: { id: true, priority: true },
    })

    const currentIndex = allGroups.findIndex((g) => g.id === groupId)

    if (currentIndex === -1) {
      return c.json(
        { message: "対象のグループが見つかりません", success: false },
        HTTP_STATUS.NOT_FOUND
      )
    }

    const swapIndex = direction === REORDER_DIRECTION.UP ? currentIndex - 1 : currentIndex + 1

    // 入れ替え先が範囲外（すでに一番上/下）の場合は何もしない
    if (swapIndex < 0 || swapIndex >= allGroups.length) {
      const response: ReorderFurnitureGroupResponse = {
        message: "並び替え順序が更新されました",
        success: true,
      }
      return c.json(response, HTTP_STATUS.OK)
    }

    // 配列上で要素を入れ替え
    const temp = allGroups[currentIndex]
    allGroups[currentIndex] = allGroups[swapIndex]
    allGroups[swapIndex] = temp

    // priority が現在のインデックスと異なるものだけを抽出して更新
    const updates = []
    for (let i = 0; i < allGroups.length; i++) {
      if (allGroups[i].priority !== i) {
        updates.push(
          prisma.furnitureGroup.update({
            data: { priority: i },
            where: { id: allGroups[i].id },
          })
        )
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    const response: ReorderFurnitureGroupResponse = {
      message: "並び替え順序が更新されました",
      success: true,
    }
    return c.json(response, HTTP_STATUS.OK)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to reorder furniture groups:", error)
    return c.json(
      { message: "サーバーエラーが発生しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
