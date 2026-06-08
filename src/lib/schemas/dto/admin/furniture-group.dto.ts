import { reorderDirectionSchema } from "@/lib/schemas/common/reorder"
import { zString } from "@/lib/utils/zod"
import { z } from "zod"

/**
 * 除外キャラクター組み合わせ（キャラクターIDの配列）
 * グループ内でリアクション共有から除外するキャラクターの組み合わせ
 * - ソロ除外: ["char-1"]
 * - ペア除外: ["char-1", "char-2"]
 */
const excludedCombinationDtoSchema = z
  .array(zString("キャラクターIDは必須です"))
  .min(1, "除外組み合わせには少なくとも1人のキャラクターが必要です")
  .max(10, "除外組み合わせのキャラクターは10人以内で指定してください")

/**
 * グループ作成DTO
 */
export const createFurnitureGroupDtoSchema = z.object({
  excludedCombinations: z.array(excludedCombinationDtoSchema),
  furnitureIds: z.array(zString("家具IDは必須です")),
  name: zString("グループ名は必須です", {
    max: 100,
    maxMessage: "グループ名は100文字以内で入力してください",
  }),
})

/**
 * グループ更新DTO
 * - excludedCombinationsは既存の除外組み合わせを全て置き換える
 * - furnitureIdsは指定した家具をグループに追加
 */
export const updateFurnitureGroupDtoSchema = z.object({
  excludedCombinations: z.array(excludedCombinationDtoSchema),
  furnitureIds: z.array(zString("家具IDは必須です")),
  name: zString("グループ名は必須です", {
    max: 100,
    maxMessage: "グループ名は100文字以内で入力してください",
  }),
})

export type CreateFurnitureGroupDto = z.infer<typeof createFurnitureGroupDtoSchema>
export type UpdateFurnitureGroupDto = z.infer<typeof updateFurnitureGroupDtoSchema>

/**
 * グループ並び替えDTO
 */
export const reorderFurnitureGroupDtoSchema = z.object({
  direction: reorderDirectionSchema,
})

export type ReorderFurnitureGroupDto = z.infer<typeof reorderFurnitureGroupDtoSchema>

/**
 * グループ検索クエリDTO
 */
export const furnitureGroupsQueryDtoSchema = z.object({
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
})

/**
 * グループIDパスパラメータDTO
 */
export const furnitureGroupParamDtoSchema = z.object({
  groupId: z
    .string()
    .regex(/^[a-z0-9]+$/, "不正なIDフォーマットです")
    .openapi({ description: "Group ID", example: "clxxxxx", format: "cuid2" }),
})
