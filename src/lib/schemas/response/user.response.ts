import { z } from "zod"
import { createApiDataResponseSchema } from "./api.response"

// ユーザーデータスキーマ
export const currentUserDataSchema = z.object({
  avatarUrl: z.string().nullable(),
  discordId: z.string(),
  email: z.string().nullable(),
  id: z.string(),
  name: z.string().nullable(),
  role: z.enum(["Admin", "Editor", "Viewer"]),
})

// ユーザーレスポンススキーマ
export const currentUserResponseSchema = createApiDataResponseSchema(currentUserDataSchema)

// 設定データスキーマ
export const currentSettingDataSchema = z.object({
  isRegistered: z.boolean(),
  leaderSheetUrl: z.string().nullable(),
})

// 設定レスポンススキーマ
export const currentSettingResponseSchema = createApiDataResponseSchema(currentSettingDataSchema)

// Zodスキーマから推論される型定義
export type CurrentUserData = z.infer<typeof currentUserDataSchema>
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>
export type CurrentSettingData = z.infer<typeof currentSettingDataSchema>
export type CurrentSettingResponse = z.infer<typeof currentSettingResponseSchema>
