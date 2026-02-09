import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { createFurnitureGroupDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { CreateFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { formatZodErrors } from "@/lib/utils/zod"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const createFurnitureGroup: Handler = async (c) => {
  try {
    const body = await c.req.json()
    const parsed = createFurnitureGroupDtoSchema.safeParse(body)

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

    // 全てのキャラクターIDを収集
    const allCharacterIds = new Set<string>()
    for (const combination of excludedCombinations) {
      for (const id of combination) {
        allCharacterIds.add(id)
      }
    }

    // キャラクターIDの存在確認
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
    const groupId = createId()

    // トランザクションで作成
    await prisma.$transaction(async (tx) => {
      // グループを作成
      await tx.furnitureGroup.create({
        data: {
          id: groupId,
          name,
          updatedAt: now,
        },
      })

      // 除外キャラクター組み合わせを作成
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

    const response: CreateFurnitureGroupResponse = {
      data: { id: groupId },
      message: "グループを作成しました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.CREATED)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json(
        { message: "同じ名前のグループが既に存在します", success: false },
        HTTP_STATUS.CONFLICT
      )
    }
    return c.json(
      { message: "グループの作成に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
