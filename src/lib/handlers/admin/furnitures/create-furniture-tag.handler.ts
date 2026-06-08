import { HTTP_STATUS } from "@/constants/http-status"
import {
  Tags,
  commonResponses,
  cookieAuth,
  jsonRequest,
  jsonResponse,
} from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { createFurnitureTagDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { CreateFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { createFurnitureTagResponseSchema } from "@/lib/schemas/response/admin/furniture-tag.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"

import {
  getCharacterSorter,
  getExistingExclusionKeys,
  prepareFurnitureTransactionData,
  validateAndGetCharacterMap,
  validateGroupsExist,
  validateSameUnitReactions,
} from "./furniture-tag.helper"

export const createFurnitureTagRoute = createRoute({
  description: "家具（任意）を含む新しい家具タグを作成する（一括作成）",
  method: "post",
  path: "/api/admin/furniture-tags",
  request: jsonRequest(createFurnitureTagDtoSchema),
  responses: {
    ...jsonResponse(201, createFurnitureTagResponseSchema, "家具タグを作成しました"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具タグ作成",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const createFurnitureTag: RouteHandler<typeof createFurnitureTagRoute, AppEnv> = async (
  c
) => {
  try {
    const { furnitures, name } = c.req.valid("json")

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
    const tagId = createId()

    // 現在の最大 priority を取得して一番下に追加する
    const maxPriorityTag = await prisma.furnitureTag.findFirst({
      orderBy: { priority: "desc" },
      select: { priority: true },
    })
    const priority = maxPriorityTag ? maxPriorityTag.priority + 1 : 0

    // トランザクションで一括作成
    await prisma.$transaction(
      async (tx) => {
        // グループの既存除外組み合わせを取得（重複防止用）
        const existingExclusionKeys = await getExistingExclusionKeys(tx, groupIds)

        const transactionData = prepareFurnitureTransactionData({
          existingExclusionKeys,
          furnitures,
          now,
          sortCharacterIds,
          tagId,
        })

        // データベースへ保存
        await tx.furnitureTag.create({
          data: {
            id: tagId,
            name,
            priority,
          },
        })
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

    const response: CreateFurnitureTagResponse = {
      data: { id: tagId },
      message: "タグを作成しました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.CREATED)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[createFurnitureTag] error:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json(
        { message: "同じ名前のタグが既に存在します", success: false },
        HTTP_STATUS.CONFLICT
      )
    }
    return c.json(
      { message: "タグの作成に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
