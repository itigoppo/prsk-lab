import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { updateFurnitureGroupDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { UpdateFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { formatZodErrors } from "@/lib/utils/zod"
import { createId } from "@paralleldrive/cuid2"
import type { Handler } from "hono"

export const updateFurnitureGroup: Handler = async (c) => {
  try {
    const groupId = c.req.param("groupId")
    const body = await c.req.json()
    const parsed = updateFurnitureGroupDtoSchema.safeParse(body)

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

    const { excludedCombinations, furnitureIds, name } = parsed.data

    // グループの存在確認
    const existingGroup = await prisma.furnitureGroup.findUnique({
      select: { id: true },
      where: { id: groupId },
    })

    if (!existingGroup) {
      return c.json({ message: "グループが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // 除外組み合わせのキャラクターIDを検証
    const allCharacterIds = new Set<string>()
    for (const combination of excludedCombinations) {
      for (const id of combination) {
        allCharacterIds.add(id)
      }
    }

    if (allCharacterIds.size > 0) {
      const characters = await prisma.character.findMany({
        select: { id: true },
        where: { id: { in: Array.from(allCharacterIds) } },
      })

      const existingIds = new Set(characters.map((ch) => ch.id))
      const missingIds = Array.from(allCharacterIds).filter((id) => !existingIds.has(id))
      if (missingIds.length > 0) {
        return c.json(
          {
            message: `不明なキャラクターID: ${missingIds.join(", ")}`,
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    // 家具IDの存在確認
    if (furnitureIds.length > 0) {
      const furnitures = await prisma.furniture.findMany({
        select: { id: true },
        where: { id: { in: furnitureIds } },
      })

      const existingFurnitureIds = new Set(furnitures.map((f) => f.id))
      const missingFurnitureIds = furnitureIds.filter((id) => !existingFurnitureIds.has(id))
      if (missingFurnitureIds.length > 0) {
        return c.json(
          {
            message: `不明な家具ID: ${missingFurnitureIds.join(", ")}`,
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    const now = new Date()

    // トランザクションで更新
    await prisma.$transaction(async (tx) => {
      // グループを更新
      await tx.furnitureGroup.update({
        data: {
          name,
          updatedAt: now,
        },
        where: { id: groupId },
      })

      // 既存の除外組み合わせを削除
      await tx.furnitureGroupExcludedCharacter.deleteMany({
        where: { groupId },
      })

      // 新しい除外組み合わせを作成
      for (const combination of excludedCombinations) {
        const combinationId = createId()
        for (const characterId of combination) {
          await tx.furnitureGroupExcludedCharacter.create({
            data: {
              characterId,
              combinationId,
              groupId,
              id: createId(),
            },
          })
        }
      }

      // 指定された家具をグループに追加
      if (furnitureIds.length > 0) {
        await tx.furniture.updateMany({
          data: { groupId, updatedAt: now },
          where: { id: { in: furnitureIds } },
        })
      }
    })

    const response: UpdateFurnitureGroupResponse = {
      message: "グループを更新しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "グループの更新に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
