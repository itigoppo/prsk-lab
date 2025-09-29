import z from "zod"
import { SchemaErrors } from "./utils"

// ユーザー登録スキーマ
export const createUserSchema = z.object({
  avatarUrl: z.string().trim().nullable(),
  discordId: z.string().trim().min(1, "Discord IDは必須です"),
  email: z.string().trim().nullable(),
  name: z.string().trim().nullable(),
})

// スキーマから型作成
export type CreateUserSchema = z.infer<typeof createUserSchema>

// バリデーションエラーの型（スキーマから自動生成）
export type CreateUserValidationErrors = SchemaErrors<CreateUserSchema>

// 設定作成スキーマ
export const createSettingSchema = z.object({
  leaderSheetUrl: z.string().trim().nullable(),
})

// スキーマから型作成
export type CreateSettingSchema = z.infer<typeof createSettingSchema>

// バリデーションエラーの型（スキーマから自動生成）
export type CreateSettingValidationErrors = SchemaErrors<CreateSettingSchema>

// 設定更新スキーマ
export const updateSettingSchema = createSettingSchema

// スキーマから型作成
export type UpdateSettingSchema = z.infer<typeof updateSettingSchema>

// バリデーションエラーの型（スキーマから自動生成）
export type UpdateSettingValidationErrors = SchemaErrors<UpdateSettingSchema>
