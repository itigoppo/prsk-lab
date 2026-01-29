import { z } from "zod"

// 共通APIレスポンススキーマ
export const apiResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

// データ付きAPIレスポンススキーマのファクトリー
export function createApiDataResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return apiResponseSchema.extend({
    data: dataSchema.optional(),
  })
}

// Zodスキーマから推論される型定義
export type ApiResponse = z.infer<typeof apiResponseSchema>
