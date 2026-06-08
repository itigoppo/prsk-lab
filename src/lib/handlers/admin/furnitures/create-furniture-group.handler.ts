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
import { createFurnitureGroupDtoSchema } from "@/lib/schemas/dto/admin/furniture-group.dto"
import type { CreateFurnitureGroupResponse } from "@/lib/schemas/response/admin/furniture-group.response"
import { createFurnitureGroupResponseSchema } from "@/lib/schemas/response/admin/furniture-group.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"

export const createFurnitureGroupRoute = createRoute({
  description: "除外キャラクターの組み合わせ（任意）を含む新しい家具グループを作成する",
  method: "post",
  path: "/api/admin/furniture-groups",
  request: jsonRequest(createFurnitureGroupDtoSchema),
  responses: {
    ...jsonResponse(201, createFurnitureGroupResponseSchema, "家具グループを作成しました"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [cookieAuth],
  summary: "家具グループ作成",
  tags: [Tags.ADMIN_FURNITURES.name],
})

export const createFurnitureGroup: RouteHandler<typeof createFurnitureGroupRoute, AppEnv> = async (
  c
) => {
  try {
    const { excludedCombinations, furnitureIds, name } = c.req.valid("json")

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

    const groupId = createId()

    // 現在の最大priorityを取得
    const maxPriorityGroup = await prisma.furnitureGroup.findFirst({
      orderBy: { priority: "desc" },
      select: { priority: true },
    })
    const priority = maxPriorityGroup ? maxPriorityGroup.priority + 1 : 0

    // トランザクションで作成
    await prisma.$transaction(async (tx) => {
      // グループを作成
      await tx.furnitureGroup.create({
        data: {
          id: groupId,
          name,
          priority,
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
          data: { groupId },
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
