import { z } from "zod"

// 設定作成DTOスキーマ
export const createSettingDtoSchema = z.object({
  leaderSheetUrl: z.string().trim().nullable(),
})

// 設定更新DTOスキーマ
export const updateSettingDtoSchema = z.object({
  leaderSheetUrl: z.string().trim().nullable(),
})

// Zodスキーマから推論される型定義（Single Source of Truth）
export type CreateSettingDto = z.infer<typeof createSettingDtoSchema>
export type UpdateSettingDto = z.infer<typeof updateSettingDtoSchema>
