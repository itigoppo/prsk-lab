import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import {
  Furniture,
  FurnitureListResponse,
  FurnitureReaction,
  FurnitureTag,
} from "@/lib/schemas/response/furniture.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getFurnituresByUnit: Handler = async (c) => {
  try {
    const unitCode = c.req.param("unitCode")
    const searchQuery = c.req.query("q")
    const hideCompleted = c.req.query("hideCompleted") === "true"
    const ownedOnly = c.req.query("ownedOnly") === "true"
    const characterIdsParam = c.req.query("characterIds")
    const filterCharacterIds = characterIdsParam ? characterIdsParam.split(",") : []
    const discordId = c.get("discordId")

    // ユニット情報を取得
    const unit = await prisma.unit.findUnique({
      select: {
        bgColor: true,
        characters: {
          select: { id: true },
        },
        code: true,
        id: true,
        name: true,
      },
      where: { code: unitCode },
    })

    if (!unit) {
      return c.json({ message: "ユニットが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    const characterIds = unit.characters.map((c) => c.id)

    // ユニットのキャラクターが関連するリアクションを持つ家具を取得
    const tags = await prisma.furnitureTag.findMany({
      orderBy: { createdAt: Prisma.SortOrder.asc },
      select: {
        furnitures: {
          select: {
            groupId: true,
            id: true,
            name: true,
            reactions: {
              select: {
                characters: {
                  select: {
                    characterId: true,
                  },
                },
                id: true,
              },
              where: {
                characters: {
                  some: {
                    characterId: { in: characterIds },
                  },
                },
              },
            },
          },
          where: searchQuery
            ? {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              }
            : undefined,
        },
        id: true,
        name: true,
      },
    })

    // キャラクター情報を取得（リアクションのキャラクター表示用）
    const characters = await prisma.character.findMany({
      select: {
        bgColor: true,
        id: true,
        name: true,
        short: true,
      },
    })

    // VSユニットのキャラクターカラーを取得（ユニットカラーと同じ場合の置き換え用）
    const vsCharacters = await prisma.character.findMany({
      select: {
        bgColor: true,
        name: true,
      },
      where: {
        unit: { code: "vs" },
      },
    })
    const vsColorMap = new Map(vsCharacters.map((c) => [c.name, c.bgColor]))

    const characterMap = new Map(characters.map((c) => [c.id, c]))

    // グループから除外されている組み合わせを取得
    const excludedCharacters = await prisma.furnitureGroupExcludedCharacter.findMany({
      select: {
        characterId: true,
        combinationId: true,
        groupId: true,
      },
    })
    // combinationIdでグルーピングして、各組み合わせのキャラクターIDを取得
    const combinationMap = new Map<string, { characterIds: string[]; groupId: string }>()
    for (const ec of excludedCharacters) {
      const existing = combinationMap.get(ec.combinationId)
      if (existing) {
        existing.characterIds.push(ec.characterId)
      } else {
        combinationMap.set(ec.combinationId, {
          characterIds: [ec.characterId],
          groupId: ec.groupId,
        })
      }
    }
    // キー: "groupId:sortedCharacterIds" のSetで高速判定
    const excludedSet = new Set<string>()
    for (const { characterIds, groupId } of combinationMap.values()) {
      const sortedIds = [...characterIds].sort().join(",")
      excludedSet.add(`${groupId}:${sortedIds}`)
    }

    // 指定されたグループ・キャラクター組み合わせがグループ共有から除外されているかチェック
    const isExcludedFromGroup = (groupId: string, reactionCharacterIds: string[]): boolean => {
      const sortedIds = [...reactionCharacterIds].sort().join(",")
      return excludedSet.has(`${groupId}:${sortedIds}`)
    }

    // ユーザーのチェック済みリアクションIDを取得
    let checkedReactionIds = new Set<string>()
    // 同一グループ内の同キャラ組み合わせでチェック済みを共有するためのSet
    // キー: "groupId:sortedCharacterIds"
    const checkedGroupCombinations = new Set<string>()
    // ユーザーが所持している家具IDのSet
    let ownedFurnitureIds = new Set<string>()

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        ownedFurnitures: {
          select: { furnitureId: true },
        },
      },
      where: { discordId },
    })
    if (user) {
      // 所持家具IDを取得
      ownedFurnitureIds = new Set(user.ownedFurnitures.map((f) => f.furnitureId))

      const checks = await prisma.userReactionCheck.findMany({
        select: {
          reaction: {
            select: {
              characters: {
                select: { characterId: true },
              },
              furniture: {
                select: { groupId: true },
              },
            },
          },
          reactionId: true,
        },
        where: { userId: user.id },
      })
      checkedReactionIds = new Set(checks.map((c) => c.reactionId))

      // グループに属するリアクションのキャラ組み合わせをSetに追加
      // ただし、除外キャラクターを含むリアクションは追加しない
      for (const check of checks) {
        const groupId = check.reaction.furniture.groupId
        if (groupId) {
          const charIds = check.reaction.characters.map((c) => c.characterId)
          if (!isExcludedFromGroup(groupId, charIds)) {
            checkedGroupCombinations.add(`${groupId}:${charIds.sort().join(",")}`)
          }
        }
      }
    }

    // リアクションのチェック状態を判定するヘルパー
    const getReactionCheckStatus = (
      reactionId: string,
      groupId: string | null,
      characterIds: string[]
    ): { checked: boolean; checkedByGroup: boolean } => {
      // 直接チェックされている場合
      if (checkedReactionIds.has(reactionId)) {
        return { checked: true, checkedByGroup: false }
      }

      // 同一グループ内の同キャラ組み合わせがチェック済みの場合
      // ただし、除外キャラクターを含むリアクションはグループ共有しない
      if (groupId && !isExcludedFromGroup(groupId, characterIds)) {
        const sortedCharIds = [...characterIds].sort()
        const key = `${groupId}:${sortedCharIds.join(",")}`
        if (checkedGroupCombinations.has(key)) {
          return { checked: true, checkedByGroup: true }
        }
      }

      return { checked: false, checkedByGroup: false }
    }

    // 指定されたキャラクターIDでフィルタリングするかチェック
    const shouldIncludeReaction = (reactionCharacterIds: string[]): boolean => {
      if (filterCharacterIds.length === 0) return true
      return reactionCharacterIds.some((id) => filterCharacterIds.includes(id))
    }

    // リアクションをレスポンス形式に変換するヘルパー
    const toReactionResponse = (
      reaction: (typeof tags)[number]["furnitures"][number]["reactions"][number],
      groupId: string | null
    ): FurnitureReaction => {
      const checkStatus = getReactionCheckStatus(
        reaction.id,
        groupId,
        reaction.characters.map((c) => c.characterId)
      )

      return {
        characters: reaction.characters
          .map((rc) => {
            const char = characterMap.get(rc.characterId)
            if (!char) return null

            // キャラクターのカラーがユニットカラーと同じ場合はVSのカラーを使用
            let color = char.bgColor ?? "#ffffff"
            if (char.bgColor === unit.bgColor) {
              color = vsColorMap.get(char.name) ?? color
            }

            return { color, id: char.id, short: char.short }
          })
          .filter((c): c is NonNullable<typeof c> => c !== null),
        checked: checkStatus.checked,
        checkedByGroup: checkStatus.checkedByGroup,
        id: reaction.id,
      }
    }

    // 2人以上のリアクションを持つ家具を収集
    const groupReactionFurnitures: Furniture[] = []

    // レスポンス形式に変換（ソロリアクションのみ）
    const responseTags: FurnitureTag[] = tags
      .map((tag) => {
        const furnitures: Furniture[] = tag.furnitures
          .filter((f) => f.reactions.length > 0)
          // 所持家具のみフィルタ
          .filter((f) => !ownedOnly || ownedFurnitureIds.has(f.id))
          .map((furniture) => {
            // キャラクターIDでフィルタリング
            const filteredReactions = furniture.reactions.filter((r) =>
              shouldIncludeReaction(r.characters.map((c) => c.characterId))
            )

            const soloReactions = filteredReactions.filter((r) => r.characters.length === 1)
            const groupReactions = filteredReactions.filter((r) => r.characters.length >= 2)

            // 2人以上のリアクションがある場合は別タグ用に収集
            if (groupReactions.length > 0) {
              groupReactionFurnitures.push({
                groupId: furniture.groupId,
                id: furniture.id,
                name: furniture.name,
                reactions: groupReactions.map((r) => toReactionResponse(r, furniture.groupId)),
              })
            }

            return {
              groupId: furniture.groupId,
              id: furniture.id,
              name: furniture.name,
              reactions: soloReactions.map((r) => toReactionResponse(r, furniture.groupId)),
            }
          })
          .filter((f) => f.reactions.length > 0) // ソロリアクションがある家具のみ

        return {
          furnitures,
          id: tag.id,
          name: tag.name,
        }
      })
      .filter((tag) => tag.furnitures.length > 0)

    // 2人以上で反応する家具タグを追加
    if (groupReactionFurnitures.length > 0) {
      responseTags.push({
        furnitures: groupReactionFurnitures,
        id: "group-reactions",
        name: "2人以上で反応する家具",
      })
    }

    // hideCompleted: 家具内の全リアクションがチェック済みなら除外
    const filteredTags = hideCompleted
      ? responseTags
          .map((tag) => ({
            ...tag,
            furnitures: tag.furnitures.filter((furniture) => {
              const allChecked = furniture.reactions.every((r) => r.checked)
              return !allChecked
            }),
          }))
          .filter((tag) => tag.furnitures.length > 0)
      : responseTags

    const response: FurnitureListResponse = {
      data: {
        tags: filteredTags,
        unitCode: unit.code,
        unitName: unit.name,
      },
      message: "家具一覧を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "家具一覧の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
