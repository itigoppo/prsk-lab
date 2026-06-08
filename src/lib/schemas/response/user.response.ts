import { userRoleSchema } from "@/lib/schemas/common/user-role"
import { z } from "@hono/zod-openapi"
import { createApiDataResponseSchema } from "./api.response"

// ユーザーデータスキーマ
export const currentUserDataSchema = z
  .object({
    avatarUrl: z.string().nullable(),
    discordId: z.string(),
    email: z.string().nullable(),
    id: z.string(),
    name: z.string().nullable(),
    role: userRoleSchema,
  })
  .openapi("CurrentUser")

// ユーザーレスポンススキーマ
export const currentUserResponseSchema =
  createApiDataResponseSchema(currentUserDataSchema).openapi("CurrentUserResponse")

// 設定データスキーマ
export const currentSettingDataSchema = z
  .object({
    isRegistered: z.boolean(),
    leaderSheetUrl: z.string().nullable(),
  })
  .openapi("CurrentSetting")

// 設定レスポンススキーマ
export const currentSettingResponseSchema =
  createApiDataResponseSchema(currentSettingDataSchema).openapi("CurrentSettingResponse")

// Zodスキーマから推論される型定義
export type CurrentUserData = z.infer<typeof currentUserDataSchema>
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>
export type CurrentSettingData = z.infer<typeof currentSettingDataSchema>
export type CurrentSettingResponse = z.infer<typeof currentSettingResponseSchema>
