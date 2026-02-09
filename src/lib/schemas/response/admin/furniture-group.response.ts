import { z } from "zod"
import { paginationMetaSchema } from "../../common/pagination"

// グループ一覧用（概要）
export const adminFurnitureGroupSummarySchema = z.object({
  excludedCombinationCount: z.number(),
  furnitureCount: z.number(),
  id: z.string(),
  name: z.string(),
})

// 除外キャラクター情報
const excludedCharacterSchema = z.object({
  bgColor: z.string(),
  color: z.string(),
  id: z.string(),
  short: z.string(),
})

// 除外組み合わせ情報
const excludedCombinationSchema = z.object({
  characters: z.array(excludedCharacterSchema),
  combinationId: z.string(),
})

// グループに属する家具情報
const groupFurnitureSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagId: z.string(),
  tagName: z.string(),
})

// グループ詳細
export const adminFurnitureGroupDetailSchema = z.object({
  excludedCombinations: z.array(excludedCombinationSchema),
  furnitures: z.array(groupFurnitureSchema),
  id: z.string(),
  name: z.string(),
})

// グループ作成レスポンス（IDのみ）
export const createFurnitureGroupResponseSchema = z.object({
  data: z.object({
    id: z.string(),
  }),
  message: z.string(),
  success: z.boolean(),
})

// グループ一覧レスポンス
export const getFurnitureGroupsResponseSchema = z.object({
  data: z.object({
    groups: z.array(adminFurnitureGroupSummarySchema),
    pagination: paginationMetaSchema,
  }),
  message: z.string(),
  success: z.boolean(),
})

// グループ更新レスポンス（データなし）
export const updateFurnitureGroupResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

// グループ詳細レスポンス
export const getFurnitureGroupResponseSchema = z.object({
  data: z.object({
    group: adminFurnitureGroupDetailSchema,
  }),
  message: z.string(),
  success: z.boolean(),
})

// グループ削除レスポンス（データなし）
export const deleteFurnitureGroupResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

export type AdminFurnitureGroupSummary = z.infer<typeof adminFurnitureGroupSummarySchema>
export type AdminFurnitureGroupDetail = z.infer<typeof adminFurnitureGroupDetailSchema>
export type CreateFurnitureGroupResponse = z.infer<typeof createFurnitureGroupResponseSchema>
export type GetFurnitureGroupResponse = z.infer<typeof getFurnitureGroupResponseSchema>
export type GetFurnitureGroupsResponse = z.infer<typeof getFurnitureGroupsResponseSchema>
export type UpdateFurnitureGroupResponse = z.infer<typeof updateFurnitureGroupResponseSchema>
export type DeleteFurnitureGroupResponse = z.infer<typeof deleteFurnitureGroupResponseSchema>
