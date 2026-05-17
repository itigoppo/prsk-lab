import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { FurnitureWithReactionsDto } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"
import type { Context } from "hono"

export type CharacterMap = Map<
  string,
  { isVirtualSinger: boolean; priority: number; unitId: string | null }
>

/**
 * 全キャラクターIDを収集し、実在チェックおよびソート用情報のマップを作成する
 */
export async function validateAndGetCharacterMap(
  c: Context,
  furnitures: FurnitureWithReactionsDto[]
): Promise<CharacterMap | Response> {
  const allCharacterIds = new Set<string>()
  for (const furniture of furnitures) {
    for (const reaction of furniture.reactions) {
      for (const id of reaction.characters) {
        allCharacterIds.add(id)
      }
    }
  }

  const vsNames = ["miku", "rin", "len", "luka", "meiko", "kaito"]
  const characterMap: CharacterMap = new Map()

  if (allCharacterIds.size > 0) {
    const characters = await prisma.character.findMany({
      select: { code: true, id: true, priority: true, unitId: true },
      where: { id: { in: Array.from(allCharacterIds) } },
    })

    for (const ch of characters) {
      const suffix = ch.code.split("_").pop() ?? ""
      characterMap.set(ch.id, {
        isVirtualSinger: vsNames.includes(suffix),
        priority: ch.priority,
        unitId: ch.unitId,
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

  return characterMap
}

/**
 * 1つのリアクション内に異なるユニットのキャラクターが混在していないかバリデーションする
 */
export function validateSameUnitReactions(
  c: Context,
  furnitures: FurnitureWithReactionsDto[],
  characterMap: CharacterMap
): Response | null {
  for (const furniture of furnitures) {
    for (const reaction of furniture.reactions) {
      if (reaction.characters.length <= 1) continue
      const unitIds = new Set<string>()
      for (const id of reaction.characters) {
        const char = characterMap.get(id)
        if (char) unitIds.add(char.unitId ?? "none")
      }
      if (unitIds.size > 1) {
        return c.json(
          {
            message: "ユニットをまたいだリアクションは作成できません",
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }
  }
  return null
}

/**
 * オリジナルメンバー（Virtual Singer以外）優先、その後 priority 順でキャラクターIDをソートする関数を返す
 */
export function getCharacterSorter(characterMap: CharacterMap) {
  return (ids: string[]) =>
    [...ids].sort((a, b) => {
      const ca = characterMap.get(a)!
      const cb = characterMap.get(b)!
      if (ca.isVirtualSinger !== cb.isVirtualSinger) {
        return ca.isVirtualSinger ? 1 : -1
      }
      return ca.priority - cb.priority
    })
}

/**
 * 入力された furniture の groupId が全て実在するか検証する
 */
export async function validateGroupsExist(
  c: Context,
  furnitures: FurnitureWithReactionsDto[]
): Promise<{ errorResponse: Response | null; groupIds: string[] }> {
  const groupIds = furnitures.map((f) => f.groupId).filter((id): id is string => id != null)
  if (groupIds.length > 0) {
    const groups = await prisma.furnitureGroup.findMany({
      select: { id: true },
      where: { id: { in: groupIds } },
    })
    const existingGroupIds = new Set(groups.map((g) => g.id))
    const missingGroupIds = groupIds.filter((id) => !existingGroupIds.has(id))
    if (missingGroupIds.length > 0) {
      return {
        errorResponse: c.json(
          {
            message: `不明なグループID: ${missingGroupIds.join(", ")}`,
            success: false,
          },
          HTTP_STATUS.BAD_REQUEST
        ),
        groupIds,
      }
    }
  }
  return { errorResponse: null, groupIds }
}

/**
 * トランザクション内で、指定された groupId 群の既存の除外組み合わせを取得する
 */
export async function getExistingExclusionKeys(
  tx: Prisma.TransactionClient,
  groupIds: string[]
): Promise<Map<string, Set<string>>> {
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
  return existingExclusionKeys
}

/**
 * トランザクションで保存・更新するための配列データを生成する
 */
export function prepareFurnitureTransactionData(params: {
  existingExclusionKeys: Map<string, Set<string>>
  existingFurnitureIds?: Set<string>
  existingReactionIds?: Set<string>
  furnitures: FurnitureWithReactionsDto[]
  now: Date
  sortCharacterIds: (ids: string[]) => string[]
  tagId: string
}) {
  const {
    existingExclusionKeys,
    existingFurnitureIds,
    existingReactionIds,
    furnitures,
    now,
    sortCharacterIds,
    tagId,
  } = params

  // 新規作成用の配列
  const furnituresData: Prisma.FurnitureCreateManyInput[] = []
  const reactionsData: Prisma.FurnitureReactionCreateManyInput[] = []
  const reactionCharactersData: Prisma.FurnitureReactionCharacterCreateManyInput[] = []
  const exclusionData: Prisma.FurnitureGroupExcludedCharacterCreateManyInput[] = []

  // 更新用の配列
  const furnitureUpdates: {
    groupId: string | null
    id: string
    name: string
    priority: number
  }[] = []
  const reactionUpdates: {
    id: string
    priority: number
  }[] = []

  // 事前に作成する総アイテム数を計算
  let totalItems = 0
  for (const f of furnitures) {
    for (const r of f.reactions) {
      totalItems += r.characters.length
      if (f.groupId && r.excludeFromGroup) {
        totalItems += r.characters.length
      }
    }
  }

  // スタート時刻を（現在のミリ秒 - 総数）とする
  let currentMs = now.getTime() - totalItems

  for (const [fIndex, furniture] of furnitures.entries()) {
    let furnitureId = furniture.id
    if (furnitureId && existingFurnitureIds?.has(furnitureId)) {
      // 家具が既に存在する場合は更新
      furnitureUpdates.push({
        groupId: furniture.groupId ?? null,
        id: furnitureId,
        name: furniture.name,
        priority: fIndex,
      })
    } else {
      // 新規作成
      furnitureId = createId()
      furnituresData.push({
        groupId: furniture.groupId ?? null,
        id: furnitureId,
        name: furniture.name,
        priority: fIndex,
        tagId,
      })
    }

    // 同じ組み合わせのリアクションをスキップするためのセット
    const processedCombinations = new Set<string>()
    for (const [rIndex, reaction] of furniture.reactions.entries()) {
      // キャラクターIDをソート
      const sortedCharacterIds = sortCharacterIds(reaction.characters)
      // 同じ組み合わせのリアクションをスキップするためのキー
      const combinationKey = [...sortedCharacterIds].sort().join(",")
      if (processedCombinations.has(combinationKey)) {
        // 同じ組み合わせのリアクションはスキップ
        continue
      }
      processedCombinations.add(combinationKey)

      // リアクションのIDを取得
      let reactionId = reaction.id
      if (reactionId && existingReactionIds?.has(reactionId)) {
        // リアクションが既に存在する場合は更新
        reactionUpdates.push({
          id: reactionId,
          priority: rIndex,
        })
      } else {
        // 新規作成
        reactionId = createId()
        reactionsData.push({
          furnitureId: furnitureId!,
          id: reactionId,
          priority: rIndex,
        })
      }

      for (const characterId of sortedCharacterIds) {
        currentMs += 1
        const charTime = new Date(currentMs)
        reactionCharactersData.push({
          characterId,
          createdAt: charTime,
          id: createId(),
          reactionId: reactionId!,
        })
      }

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

  return {
    exclusionData,
    furnituresData,
    furnitureUpdates,
    reactionCharactersData,
    reactionsData,
    reactionUpdates,
  }
}
