import { z } from "zod"
import { paginationMetaSchema } from "../../common/pagination"

// 管理用キャラクター情報
export const adminCharacterSchema = z.object({
  bgColor: z.string(),
  color: z.string(),
  id: z.string(),
  short: z.string(),
})

// 管理用リアクション情報
export const adminReactionSchema = z.object({
  characters: z.array(adminCharacterSchema),
  excludeFromGroup: z.boolean(),
  id: z.string(),
})

// 管理用家具情報（タグ詳細用 - リアクションなし）
export const adminFurnitureSummarySchema = z.object({
  groupId: z.string().nullable(),
  groupName: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  reactionCount: z.number(),
})

// 管理用家具情報（家具詳細用 - リアクションあり）
export const adminFurnitureDetailSchema = z.object({
  groupId: z.string().nullable(),
  groupName: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  reactions: z.array(adminReactionSchema),
  tagId: z.string(),
  tagName: z.string(),
})

// 管理用家具情報（タグ詳細用 - リアクション付き）
export const adminFurnitureWithReactionsSchema = z.object({
  groupId: z.string().nullable(),
  groupName: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  reactions: z.array(adminReactionSchema),
})

// 管理用タグ情報（詳細）
export const adminFurnitureTagDetailSchema = z.object({
  createdAt: z.string(),
  furnitures: z.array(adminFurnitureWithReactionsSchema),
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
})

// タグ一覧用（概要）
export const adminFurnitureTagSummarySchema = z.object({
  furnitureCount: z.number(),
  id: z.string(),
  name: z.string(),
})

// タグ作成レスポンス（IDのみ）
export const createFurnitureTagResponseSchema = z.object({
  data: z.object({
    id: z.string(),
  }),
  message: z.string(),
  success: z.boolean(),
})

// タグ一覧レスポンス
export const getFurnitureTagsResponseSchema = z.object({
  data: z.object({
    pagination: paginationMetaSchema,
    tags: z.array(adminFurnitureTagSummarySchema),
  }),
  message: z.string(),
  success: z.boolean(),
})

// タグ詳細レスポンス
export const getFurnitureTagResponseSchema = z.object({
  data: z.object({
    tag: adminFurnitureTagDetailSchema,
  }),
  message: z.string(),
  success: z.boolean(),
})

// タグ更新レスポンス（データなし）
export const updateFurnitureTagResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

// タグ削除レスポンス（データなし）
export const deleteFurnitureTagResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

export type AdminCharacter = z.infer<typeof adminCharacterSchema>
export type AdminReaction = z.infer<typeof adminReactionSchema>
export type AdminFurnitureSummary = z.infer<typeof adminFurnitureSummarySchema>
export type AdminFurnitureDetail = z.infer<typeof adminFurnitureDetailSchema>
export type AdminFurnitureTagDetail = z.infer<typeof adminFurnitureTagDetailSchema>
export type AdminFurnitureTagSummary = z.infer<typeof adminFurnitureTagSummarySchema>
export type CreateFurnitureTagResponse = z.infer<typeof createFurnitureTagResponseSchema>
export type GetFurnitureTagsResponse = z.infer<typeof getFurnitureTagsResponseSchema>
export type GetFurnitureTagResponse = z.infer<typeof getFurnitureTagResponseSchema>
export type UpdateFurnitureTagResponse = z.infer<typeof updateFurnitureTagResponseSchema>
export type DeleteFurnitureTagResponse = z.infer<typeof deleteFurnitureTagResponseSchema>
