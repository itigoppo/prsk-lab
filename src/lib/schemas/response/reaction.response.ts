import { z } from "@hono/zod-openapi"

// リアクションチェックレスポンス
export const reactionCheckResponseSchema = z
  .object({
    data: z.object({
      checked: z.boolean(),
      reactionId: z.string(),
    }),
    message: z.string(),
    success: z.boolean(),
  })
  .openapi("ReactionCheckResponse")

export type ReactionCheckResponse = z.infer<typeof reactionCheckResponseSchema>
