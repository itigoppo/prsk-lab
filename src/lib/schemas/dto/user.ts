import { z } from "zod"

// ユーザー作成DTOスキーマ
export const createUserDtoSchema = z.object({
  avatarUrl: z.union([z.string().trim(), z.null()]),
  discordId: z.string().trim().min(1, "Discord IDは必須です"),
  email: z.union([z.string().trim(), z.null()]),
  name: z.union([z.string().trim(), z.null()]),
})

// Zodスキーマから推論される型定義（Single Source of Truth）
export type CreateUserDto = z.infer<typeof createUserDtoSchema>
