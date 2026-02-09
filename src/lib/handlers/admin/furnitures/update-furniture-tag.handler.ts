import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { updateFurnitureTagDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import type { UpdateFurnitureTagResponse } from "@/lib/schemas/response/admin/furniture-tag.response"
import { formatZodErrors } from "@/lib/utils/zod"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

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

    // 全てのキャラクターIDを収集
    const allCharacterIds = new Set<string>()
    for (const furniture of furnitures) {
      for (const reaction of furniture.reactions) {
        for (const id of reaction.characters) {
          allCharacterIds.add(id)
        }
      }
    }

    // キャラクターIDの存在確認 + ソート用情報取得
    const vsNames = ["miku", "rin", "len", "luka", "meiko", "kaito"]
    const characterMap = new Map<string, { isVirtualSinger: boolean; priority: number }>()
    if (allCharacterIds.size > 0) {
      const characters = await prisma.character.findMany({
        select: { code: true, id: true, priority: true },
        where: { id: { in: Array.from(allCharacterIds) } },
      })

      for (const ch of characters) {
        const suffix = ch.code.split("_").pop() ?? ""
        characterMap.set(ch.id, {
          isVirtualSinger: vsNames.includes(suffix),
          priority: ch.priority,
        })
      }

      const missingIds = Array.from(allCharacterIds).filter((id) => !characterMap.has(id))
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

    // キャラクターIDをソート（オリジナルメンバー優先、priority順）
    const sortCharacterIds = (ids: string[]) =>
      [...ids].sort((a, b) => {
        const ca = characterMap.get(a)!
        const cb = characterMap.get(b)!
        if (ca.isVirtualSinger !== cb.isVirtualSinger) {
          return ca.isVirtualSinger ? 1 : -1
        }
        return ca.priority - cb.priority
      })

    // グループIDの存在確認
    const groupIds = furnitures.map((f) => f.groupId).filter((id): id is string => id != null)
    if (groupIds.length > 0) {
      const groups = await prisma.furnitureGroup.findMany({
        select: { id: true },
        where: { id: { in: groupIds } },
      })
      const existingGroupIds = new Set(groups.map((g) => g.id))
      const missingGroupIds = groupIds.filter((id) => !existingGroupIds.has(id))
      if (missingGroupIds.length > 0) {
        return c.json(
          {
            message: `不明なグループID: ${missingGroupIds.join(", ")}`,
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    const now = new Date()

    // トランザクションで一括更新
    await prisma.$transaction(async (tx) => {
      // タグを更新
      await tx.furnitureTag.update({
        data: { name, updatedAt: now },
        where: { id: tagId },
      })

      // 既存の家具を全削除（cascade で reaction, reactionCharacter も削除）
      await tx.furniture.deleteMany({
        where: { tagId },
      })

      // グループの既存除外組み合わせを取得（重複防止用）
      const existingExclusionKeys = new Map<string, Set<string>>()
      if (groupIds.length > 0) {
        const existingExclusions = await tx.furnitureGroupExcludedCharacter.findMany({
          select: { characterId: true, combinationId: true, groupId: true },
          where: { groupId: { in: groupIds } },
        })
        const combMap = new Map<string, Map<string, string[]>>()
        for (const ec of existingExclusions) {
          if (!combMap.has(ec.groupId)) combMap.set(ec.groupId, new Map())
          const group = combMap.get(ec.groupId)!
          if (!group.has(ec.combinationId)) group.set(ec.combinationId, [])
          group.get(ec.combinationId)!.push(ec.characterId)
        }
        for (const [gId, combs] of combMap.entries()) {
          const keys = new Set<string>()
          for (const charIds of combs.values()) {
            keys.add([...charIds].sort().join(","))
          }
          existingExclusionKeys.set(gId, keys)
        }
      }

      // 家具とリアクションを作成
      for (const furniture of furnitures) {
        const furnitureId = createId()
        await tx.furniture.create({
          data: {
            groupId: furniture.groupId ?? null,
            id: furnitureId,
            name: furniture.name,
            tagId,
            updatedAt: now,
          },
        })

        // リアクションを作成（同じ組み合わせは先勝ちでスキップ）
        const processedCombinations = new Set<string>()
        for (const reaction of furniture.reactions) {
          const sortedCharacterIds = sortCharacterIds(reaction.characters)
          // ソート済みIDで組み合わせキーを生成
          const combinationKey = [...sortedCharacterIds].sort().join(",")
          if (processedCombinations.has(combinationKey)) {
            continue // 同じ組み合わせはスキップ
          }
          processedCombinations.add(combinationKey)

          const reactionId = createId()
          await tx.furnitureReaction.create({
            data: {
              furnitureId,
              id: reactionId,
              updatedAt: now,
            },
          })

          for (const characterId of sortedCharacterIds) {
            await tx.furnitureReactionCharacter.create({
              data: {
                characterId,
                id: createId(),
                reactionId,
              },
            })
          }

          // グループから除外する場合、FurnitureGroupExcludedCharacterを作成（重複スキップ）
          if (furniture.groupId && reaction.excludeFromGroup) {
            const exclusionKey = [...sortedCharacterIds].sort().join(",")
            const groupExclusions = existingExclusionKeys.get(furniture.groupId)
            if (!groupExclusions?.has(exclusionKey)) {
              const combinationId = createId()
              for (const characterId of sortedCharacterIds) {
                await tx.furnitureGroupExcludedCharacter.create({
                  data: {
                    characterId,
                    combinationId,
                    groupId: furniture.groupId,
                    id: createId(),
                  },
                })
              }
              if (!existingExclusionKeys.has(furniture.groupId)) {
                existingExclusionKeys.set(furniture.groupId, new Set())
              }
              existingExclusionKeys.get(furniture.groupId)!.add(exclusionKey)
            }
          }
        }
      }
    })

    const response: UpdateFurnitureTagResponse = {
      message: "タグを更新しました",
      success: true,
    }

    return c.json(response)
  } catch (error) {
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
