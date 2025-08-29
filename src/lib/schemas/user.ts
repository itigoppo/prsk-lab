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
