import { zNullableString, zString } from "@/lib/utils/zod"
import { z } from "zod"

/**
 * リアクション定義
 */
export const reactionDtoSchema = z.object({
  characters: z
    .array(zString("キャラクターIDは必須です"))
    .min(1, "リアクションには少なくとも1人のキャラクターが必要です")
    .max(4, "リアクションのキャラクターは4人以内で指定してください"),
  excludeFromGroup: z.boolean().default(false),
})

/**
 * 家具作成データ（リアクション含む）
 */
export const furnitureWithReactionsDtoSchema = z.object({
  groupId: zNullableString("グループIDは必須です"),
  name: zString("家具名は必須です", {
    max: 100,
    maxMessage: "家具名は100文字以内で入力してください",
  }),
  reactions: z.array(reactionDtoSchema).min(1, "少なくとも1つのリアクションが必要です"),
})

/**
 * タグ作成DTO（家具の一括作成に対応）
 */
export const createFurnitureTagDtoSchema = z.object({
  furnitures: z.array(furnitureWithReactionsDtoSchema).default([]),
  name: zString("タグ名は必須です", {
    max: 100,
    maxMessage: "タグ名は100文字以内で入力してください",
  }),
})

/**
 * タグ更新DTO（家具の一括更新に対応）
 */
export const updateFurnitureTagDtoSchema = z.object({
  furnitures: z.array(furnitureWithReactionsDtoSchema).default([]),
  name: zString("タグ名は必須です", {
    max: 100,
    maxMessage: "タグ名は100文字以内で入力してください",
  }),
})

export type CreateFurnitureTagDto = z.infer<typeof createFurnitureTagDtoSchema>
export type UpdateFurnitureTagDto = z.infer<typeof updateFurnitureTagDtoSchema>
export type FurnitureWithReactionsDto = z.infer<typeof furnitureWithReactionsDtoSchema>
