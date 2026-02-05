import { z } from "zod"
import { createApiDataResponseSchema } from "./api.response"

// ユニット情報スキーマ
export const unitListItemSchema = z.object({
  bgColor: z.string(),
  code: z.string(),
  color: z.string(),
  name: z.string(),
  short: z.string(),
})

// ユニットリストデータスキーマ
export const unitListDataSchema = z.object({
  units: z.array(unitListItemSchema),
})

// ユニットリストレスポンススキーマ
export const unitListResponseSchema = createApiDataResponseSchema(unitListDataSchema)

// Zodスキーマから推論される型定義
export type UnitListItem = z.infer<typeof unitListItemSchema>
export type UnitListData = z.infer<typeof unitListDataSchema>
export type UnitListResponse = z.infer<typeof unitListResponseSchema>
