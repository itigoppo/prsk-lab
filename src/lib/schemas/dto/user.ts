import { z } from "zod"

// ユーザー作成DTOスキーマ
export const createUserDtoSchema = z.object({
  avatarUrl: z.string().trim().nullable(),
  discordId: z.string().trim().min(1, "Discord IDは必須です"),
  email: z.string().trim().nullable(),
  name: z.string().trim().nullable(),
})

// Zodスキーマから推論される型定義（Single Source of Truth）
export type CreateUserDto = z.infer<typeof createUserDtoSchema>
