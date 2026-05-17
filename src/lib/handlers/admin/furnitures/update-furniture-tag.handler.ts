import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { updateFurnitureTagDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { UpdateFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { formatZodErrors } from "@/lib/utils/zod"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

import {
  getCharacterSorter,
  getExistingExclusionKeys,
  prepareFurnitureTransactionData,
  validateAndGetCharacterMap,
  validateGroupsExist,
  validateSameUnitReactions,
} from "./furniture-tag.helper"

export const updateFurnitureTag: Handler = async (c) => {
  try {
    const tagId = c.req.param("tagId")
    const body = await c.req.json()
    const parsed = updateFurnitureTagDtoSchema.safeParse(body)

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

    const { furnitures, name } = parsed.data

    // タグの存在確認
    const existingTag = await prisma.furnitureTag.findUnique({
      select: { id: true },
      where: { id: tagId },
    })

    if (!existingTag) {
      return c.json({ message: "タグが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    // キャラクターIDの検証とマップ取得
    const characterMapResult = await validateAndGetCharacterMap(c, furnitures)
    if (characterMapResult instanceof Response) return characterMapResult
    const characterMap = characterMapResult

    // 同一ユニットバリデーション
    const unitValidationError = validateSameUnitReactions(c, furnitures, characterMap)
    if (unitValidationError) return unitValidationError

    // キャラクターIDをソート（オリジナルメンバー優先、priority順）
    const sortCharacterIds = getCharacterSorter(characterMap)

    // グループIDの存在確認
    const { errorResponse, groupIds } = await validateGroupsExist(c, furnitures)
    if (errorResponse) return errorResponse

    const now = new Date()

    // トランザクションで一括更新
    await prisma.$transaction(
      async (tx) => {
        // グループの既存除外組み合わせを取得（重複防止用）
        const existingExclusionKeys = await getExistingExclusionKeys(tx, groupIds)

        // 既存の家具とリアクション情報を取得
        const existingFurnitures = await tx.furniture.findMany({
          select: { id: true, reactions: { select: { id: true } } },
          where: { tagId },
        })

        const existingFurnitureIds = new Set(existingFurnitures.map((f) => f.id))
        const existingReactionIds = new Set(
          existingFurnitures.flatMap((f) => f.reactions.map((r) => r.id))
        )

        const sentFurnitureIds = new Set<string>()
        const sentReactionIds = new Set<string>()

        for (const f of furnitures) {
          if (f.id) sentFurnitureIds.add(f.id)
          for (const r of f.reactions) {
            if (r.id) sentReactionIds.add(r.id)
          }
        }

        const furnitureIdsToDelete = [...existingFurnitureIds].filter(
          (id) => !sentFurnitureIds.has(id)
        )
        const reactionIdsToDelete = [...existingReactionIds].filter(
          (id) => !sentReactionIds.has(id)
        )
        const reactionIdsToUpdate = [...existingReactionIds].filter((id) => sentReactionIds.has(id))

        // 不要になったデータを削除
        if (reactionIdsToDelete.length > 0) {
          await tx.furnitureReaction.deleteMany({
            where: { id: { in: reactionIdsToDelete } },
          })
        }
        if (furnitureIdsToDelete.length > 0) {
          await tx.furniture.deleteMany({
            where: { id: { in: furnitureIdsToDelete } },
          })
        }

        // 更新となるリアクションのキャラクター紐付けを一旦削除（後で再登録）
        if (reactionIdsToUpdate.length > 0) {
          await tx.furnitureReactionCharacter.deleteMany({
            where: { reactionId: { in: reactionIdsToUpdate } },
          })
        }

        // 名前の一意制約(P2002)を回避するため、更新対象の家具の名前を一旦ダミーに変更
        for (const f of furnitures) {
          if (f.id && existingFurnitureIds.has(f.id)) {
            await tx.furniture.update({
              data: { name: `_temp_${createId()}` },
              where: { id: f.id },
            })
          }
        }

        const transactionData = prepareFurnitureTransactionData({
          existingExclusionKeys,
          existingFurnitureIds,
          existingReactionIds,
          furnitures,
          now,
          sortCharacterIds,
          tagId,
        })

        // データベースへの保存（タグ更新、家具とリアクションの差分適用）
        await tx.furnitureTag.update({
          data: { name },
          where: { id: tagId },
        })

        for (const update of transactionData.furnitureUpdates) {
          await tx.furniture.update({
            data: {
              groupId: update.groupId,
              name: update.name,
              priority: update.priority,
            },
            where: { id: update.id },
          })
        }
        for (const update of transactionData.reactionUpdates) {
          await tx.furnitureReaction.update({
            data: { priority: update.priority },
            where: { id: update.id },
          })
        }

        if (transactionData.furnituresData.length > 0) {
          await tx.furniture.createMany({ data: transactionData.furnituresData })
        }
        if (transactionData.reactionsData.length > 0) {
          await tx.furnitureReaction.createMany({ data: transactionData.reactionsData })
        }
        if (transactionData.reactionCharactersData.length > 0) {
          await tx.furnitureReactionCharacter.createMany({
            data: transactionData.reactionCharactersData,
          })
        }
        if (transactionData.exclusionData.length > 0) {
          await tx.furnitureGroupExcludedCharacter.createMany({
            data: transactionData.exclusionData,
          })
        }
      },
      { timeout: 15000 }
    )

    const response: UpdateFurnitureTagResponse = {
      message: "タグを更新しました",
      success: true,
    }

    return c.json(response)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[updateFurnitureTag] error:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json(
        { message: "同じ名前のタグが既に存在します", success: false },
        HTTP_STATUS.CONFLICT
      )
    }
    return c.json(
      { message: "タグの更新に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
