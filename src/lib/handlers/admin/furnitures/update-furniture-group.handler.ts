import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import {
  furnitureGroupParamDtoSchema,
  updateFurnitureGroupDtoSchema,
} from "@/lib/schemas/dto/admin/furniture-group.dto"
import { updateFurnitureGroupResponseSchema } from "@/lib/schemas/response/admin/furniture-group.response"

import {
  Tags,
  commonResponses,
  cookieAuth,
  jsonRequest,
  jsonResponse,
} from "@/lib/hono/openapi-helpers"
import type { AppEnv } from "@/lib/hono/types"
import type { UpdateFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { createId } from "@paralleldrive/cuid2"

export const updateFurnitureGroupRoute = createRoute({
  description:
    "家具グループを更新する。excludedCombinationsが指定された場合、既存の設定は置き換えられます。",
  method: "patch",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    ...jsonRequest(updateFurnitureGroupDtoSchema),
    params: furnitureGroupParamDtoSchema,
  },
  responses: {
    ...jsonResponse(
      HTTP_STATUS.OK,
      updateFurnitureGroupResponseSchema,
      "家具グループを更新しました"
    ),
    ...commonResponses.badRequest,
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具グループ更新",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const updateFurnitureGroup: RouteHandler<typeof updateFurnitureGroupRoute, AppEnv> = async (
  c
) => {
  try {
    const groupId = c.req.param("groupId")
    const { excludedCombinations, furnitureIds, name } = c.req.valid("json")

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
        select: { id: true, unitId: true },
        where: { id: { in: Array.from(allCharacterIds) } },
      })

      const characterMap = new Map(characters.map((ch) => [ch.id, ch]))
      const existingIds = new Set(characterMap.keys())
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

      // 同一ユニットバリデーション
      for (const combination of excludedCombinations) {
        if (combination.length <= 1) continue
        const unitIds = new Set()
        for (const id of combination) {
          const char = characterMap.get(id)
          if (char) unitIds.add(char.unitId ?? "none")
        }
        if (unitIds.size > 1) {
          return c.json(
            {
              message: "ユニットをまたいだ組み合わせは作成できません",
              success: false,
            },
            HTTP_STATUS.BAD_REQUEST
          )
        }
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

    // トランザクションで更新
    await prisma.$transaction(async (tx) => {
      // グループを更新
      await tx.furnitureGroup.update({
        data: {
          name,
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

      // 指定外の家具をグループから除外
      await tx.furniture.updateMany({
        data: { groupId: null },
        where: {
          groupId,
          id: { notIn: furnitureIds },
        },
      })

      // 指定された家具をグループに追加
      if (furnitureIds.length > 0) {
        await tx.furniture.updateMany({
          data: { groupId },
          where: { id: { in: furnitureIds } },
        })
      }
    })

    const response: UpdateFurnitureGroupResponse = {
      message: "グループを更新しました",
      success: true,
    }

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "グループの更新に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
