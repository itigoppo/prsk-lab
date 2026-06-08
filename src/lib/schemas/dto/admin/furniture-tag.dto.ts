import { reorderDirectionSchema } from "@/lib/schemas/common/reorder"
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
  excludeFromGroup: z.boolean(),
  id: z.string().nullable(),
})

/**
 * 家具作成データ（リアクション含む）
 */
export const furnitureWithReactionsDtoSchema = z.object({
  groupId: zNullableString("グループIDは必須です"),
  id: z.string().nullable(),
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
  furnitures: z.array(furnitureWithReactionsDtoSchema),
  name: zString("タグ名は必須です", {
    max: 100,
    maxMessage: "タグ名は100文字以内で入力してください",
  }),
})

/**
 * タグ更新DTO（家具の一括更新に対応）
 */
export const updateFurnitureTagDtoSchema = z.object({
  furnitures: z.array(furnitureWithReactionsDtoSchema),
  name: zString("タグ名は必須です", {
    max: 100,
    maxMessage: "タグ名は100文字以内で入力してください",
  }),
})

export type CreateFurnitureTagDto = z.infer<typeof createFurnitureTagDtoSchema>
export type UpdateFurnitureTagDto = z.infer<typeof updateFurnitureTagDtoSchema>

/**
 * タグ並び替えDTO
 */
export const reorderFurnitureTagDtoSchema = z.object({
  direction: reorderDirectionSchema,
})

export type ReorderFurnitureTagDto = z.infer<typeof reorderFurnitureTagDtoSchema>
export type FurnitureWithReactionsDto = z.infer<typeof furnitureWithReactionsDtoSchema>

/**
 * タグ検索クエリDTO
 */
export const furnitureTagsQueryDtoSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(20)
    .openapi({ description: "Number of items per page", example: 20 }),
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ description: "Page number", example: 1 }),
  q: z.string().optional().openapi({
    description: "Search query for tag name (partial match, case insensitive)",
    example: "フラワー",
  }),
})

/**
 * タグIDパスパラメータDTO
 */
export const furnitureTagParamDtoSchema = z.object({
  tagId: z
    .string()
    .regex(/^[a-z0-9]+$/, "不正なIDフォーマットです")
    .openapi({ description: "Tag ID", example: "clxxxxx", format: "cuid2" }),
})
