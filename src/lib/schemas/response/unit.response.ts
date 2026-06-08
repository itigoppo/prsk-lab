import { z } from "@hono/zod-openapi"
import { createApiDataResponseSchema } from "./api.response"

// ユニット情報スキーマ
export const unitListItemSchema = z
  .object({
    bgColor: z.string(),
    code: z.string(),
    color: z.string(),
    name: z.string(),
    short: z.string(),
  })
  .openapi("UnitListItem")

// ユニットリストデータスキーマ
export const unitListDataSchema = z
  .object({
    units: z.array(unitListItemSchema),
  })
  .openapi("UnitList")

// ユニットリストレスポンススキーマ
export const unitListResponseSchema =
  createApiDataResponseSchema(unitListDataSchema).openapi("UnitListResponse")

// Zodスキーマから推論される型定義
export type UnitListItem = z.infer<typeof unitListItemSchema>
export type UnitListData = z.infer<typeof unitListDataSchema>
export type UnitListResponse = z.infer<typeof unitListResponseSchema>
