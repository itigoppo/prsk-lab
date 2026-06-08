import { z } from "@hono/zod-openapi"
import { createApiDataResponseSchema } from "./api.response"

// ユニット情報スキーマ
export const characterUnitListItemSchema = z
  .object({
    bgColor: z.string(),
    code: z.string(),
    color: z.string(),
    name: z.string(),
    short: z.string(),
  })
  .openapi("CharacterUnitListItem")

// キャラクター情報スキーマ
export const characterListItemSchema = z
  .object({
    avatarUrl: z.string().nullable(),
    bgColor: z.string(),
    code: z.string(),
    color: z.string(),
    isVirtualSinger: z.boolean(),
    name: z.string(),
    short: z.string(),
    unit: characterUnitListItemSchema.nullable(),
  })
  .openapi("CharacterListItem")

// キャラクターリストデータスキーマ
export const characterListDataSchema = z
  .object({
    characters: z.array(characterListItemSchema),
  })
  .openapi("CharacterListData")

// キャラクターリストレスポンススキーマ
export const characterListResponseSchema =
  createApiDataResponseSchema(characterListDataSchema).openapi("CharacterListResponse")

// Zodスキーマから推論される型定義
export type CharacterUnitListItem = z.infer<typeof characterUnitListItemSchema>
export type CharacterListItem = z.infer<typeof characterListItemSchema>
export type CharacterListData = z.infer<typeof characterListDataSchema>
export type CharacterListResponse = z.infer<typeof characterListResponseSchema>
