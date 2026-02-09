import { z } from "zod"

// 管理用ユニット情報
const adminCharacterUnitSchema = z.object({
  bgColor: z.string(),
  code: z.string(),
  color: z.string(),
  name: z.string(),
  short: z.string(),
})

// 管理用キャラクター情報（id含む）
export const adminCharacterListItemSchema = z.object({
  avatarUrl: z.string().nullable(),
  bgColor: z.string(),
  code: z.string(),
  color: z.string(),
  id: z.string(),
  name: z.string(),
  short: z.string(),
  unit: adminCharacterUnitSchema.nullable(),
})

// 管理用キャラクターリストレスポンス
export const adminCharacterListResponseSchema = z.object({
  data: z.object({
    characters: z.array(adminCharacterListItemSchema),
  }),
  message: z.string(),
  success: z.boolean(),
})

export type AdminCharacterListItem = z.infer<typeof adminCharacterListItemSchema>
export type AdminCharacterListResponse = z.infer<typeof adminCharacterListResponseSchema>
