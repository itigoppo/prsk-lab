import { z } from "zod"

// リアクションチェックレスポンス
export const reactionCheckResponseSchema = z.object({
  data: z.object({
    checked: z.boolean(),
    reactionId: z.string(),
  }),
  message: z.string(),
  success: z.boolean(),
})

export type ReactionCheckResponse = z.infer<typeof reactionCheckResponseSchema>
