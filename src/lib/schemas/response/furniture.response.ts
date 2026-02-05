import { z } from "zod"

// リアクションキャラクター
export const furnitureReactionCharacterSchema = z.object({
  color: z.string(),
  id: z.string(),
  short: z.string(),
})

export type FurnitureReactionCharacter = z.infer<typeof furnitureReactionCharacterSchema>

// リアクション
export const furnitureReactionSchema = z.object({
  characters: z.array(furnitureReactionCharacterSchema),
  checked: z.boolean(),
  /** 直接チェックではなく、同一グループの同キャラ組み合わせ経由でチェック済みの場合true */
  checkedByGroup: z.boolean(),
  id: z.string(),
})

export type FurnitureReaction = z.infer<typeof furnitureReactionSchema>

// 家具
export const furnitureSchema = z.object({
  groupId: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  reactions: z.array(furnitureReactionSchema),
})

export type Furniture = z.infer<typeof furnitureSchema>

// タグ（カテゴリ）
export const furnitureTagSchema = z.object({
  furnitures: z.array(furnitureSchema),
  id: z.string(),
  name: z.string(),
})

export type FurnitureTag = z.infer<typeof furnitureTagSchema>

// レスポンス
export const furnitureListResponseSchema = z.object({
  data: z.object({
    tags: z.array(furnitureTagSchema),
    unitCode: z.string(),
    unitName: z.string(),
  }),
  message: z.string(),
  success: z.boolean(),
})

export type FurnitureListResponse = z.infer<typeof furnitureListResponseSchema>

// 所持管理用の家具
export const furnitureOwnershipItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  owned: z.boolean(),
})

export type FurnitureOwnershipItem = z.infer<typeof furnitureOwnershipItemSchema>

// 所持管理用のタグ
export const furnitureOwnershipTagSchema = z.object({
  furnitures: z.array(furnitureOwnershipItemSchema),
  id: z.string(),
  name: z.string(),
})

export type FurnitureOwnershipTag = z.infer<typeof furnitureOwnershipTagSchema>

// 所持管理用レスポンス
export const furnitureOwnershipListResponseSchema = z.object({
  data: z.object({
    tags: z.array(furnitureOwnershipTagSchema),
  }),
  message: z.string(),
  success: z.boolean(),
})

export type FurnitureOwnershipListResponse = z.infer<typeof furnitureOwnershipListResponseSchema>

// 所持状態変更レスポンス
export const furnitureOwnershipResponseSchema = z.object({
  data: z.object({
    furnitureId: z.string(),
    owned: z.boolean(),
  }),
  message: z.string(),
  success: z.boolean(),
})

export type FurnitureOwnershipResponse = z.infer<typeof furnitureOwnershipResponseSchema>
