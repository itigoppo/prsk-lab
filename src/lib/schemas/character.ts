import { z } from "zod"
import { createApiDataResponseSchema } from "./api"

// ユニット情報スキーマ
export const characterUnitListItemSchema = z.object({
  bgColor: z.string(),
  code: z.string(),
  color: z.string(),
  name: z.string(),
  short: z.string(),
})

// キャラクター情報スキーマ
export const characterListItemSchema = z.object({
  avatarUrl: z.string().nullable(),
  bgColor: z.string(),
  code: z.string(),
  color: z.string(),
  isVirtualSinger: z.boolean(),
  name: z.string(),
  short: z.string(),
  unit: characterUnitListItemSchema.nullable(),
})

// キャラクターリストデータスキーマ
export const characterListDataSchema = z.object({
  characters: z.array(characterListItemSchema),
})

// キャラクターリストレスポンススキーマ
export const characterListResponseSchema = createApiDataResponseSchema(characterListDataSchema)

// Zodスキーマから推論される型定義
export type CharacterUnitListItem = z.infer<typeof characterUnitListItemSchema>
export type CharacterListItem = z.infer<typeof characterListItemSchema>
export type CharacterListData = z.infer<typeof characterListDataSchema>
export type CharacterListResponse = z.infer<typeof characterListResponseSchema>
