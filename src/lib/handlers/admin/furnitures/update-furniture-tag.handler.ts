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
    await prisma.$transaction(
      async (tx) => {
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

        // 一括登録用の配列を準備
        const furnituresData = []
        const reactionsData = []
        const reactionCharactersData = []
        const exclusionData = []

        // 事前に作成する総アイテム数を計算
        let totalItems = 0
        for (const f of furnitures) {
          totalItems += 1 // furniture
          for (const r of f.reactions) {
            totalItems += 1 // reaction
            totalItems += r.characters.length // reactionCharacters
            if (f.groupId && r.excludeFromGroup) {
              totalItems += r.characters.length // exclusions
            }
          }
        }

        // スタート時刻を（現在のミリ秒 - 総数）とする
        let currentMs = now.getTime() - totalItems

        // 家具とリアクションを作成
        for (const furniture of furnitures) {
          currentMs += 1
          const furnitureTime = new Date(currentMs)

          const furnitureId = createId()
          furnituresData.push({
            createdAt: furnitureTime,
            groupId: furniture.groupId ?? null,
            id: furnitureId,
            name: furniture.name,
            tagId,
            updatedAt: furnitureTime,
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

            currentMs += 1
            const reactionTime = new Date(currentMs)

            const reactionId = createId()
            reactionsData.push({
              createdAt: reactionTime,
              furnitureId,
              id: reactionId,
              updatedAt: reactionTime,
            })

            for (const characterId of sortedCharacterIds) {
              currentMs += 1
              const charTime = new Date(currentMs)

              reactionCharactersData.push({
                characterId,
                createdAt: charTime,
                id: createId(),
                reactionId,
              })
            }

            // グループから除外する場合、FurnitureGroupExcludedCharacterを作成（重複スキップ）
            if (furniture.groupId && reaction.excludeFromGroup) {
              const exclusionKey = [...sortedCharacterIds].sort().join(",")
              const groupExclusions = existingExclusionKeys.get(furniture.groupId)
              if (!groupExclusions?.has(exclusionKey)) {
                const combinationId = createId()
                for (const characterId of sortedCharacterIds) {
                  currentMs += 1
                  const exclusionTime = new Date(currentMs)

                  exclusionData.push({
                    characterId,
                    combinationId,
                    createdAt: exclusionTime,
                    groupId: furniture.groupId,
                    id: createId(),
                    updatedAt: exclusionTime,
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

        // データベースへの保存（タグ更新、既存家具削除、一括登録）
        await tx.furnitureTag.update({
          data: { name, updatedAt: now },
          where: { id: tagId },
        })
        await tx.furniture.deleteMany({
          where: { tagId },
        })
        if (furnituresData.length > 0) {
          await tx.furniture.createMany({ data: furnituresData })
        }
        if (reactionsData.length > 0) {
          await tx.furnitureReaction.createMany({ data: reactionsData })
        }
        if (reactionCharactersData.length > 0) {
          await tx.furnitureReactionCharacter.createMany({ data: reactionCharactersData })
        }
        if (exclusionData.length > 0) {
          await tx.furnitureGroupExcludedCharacter.createMany({ data: exclusionData })
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
