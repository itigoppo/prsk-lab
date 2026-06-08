import { z } from "zod"

// パスパラメータDTOスキーマ
export const reactionParamDtoSchema = z.object({
  reactionId: z
    .string()
    .regex(/^[a-z0-9]+$/, "不正なIDフォーマットです")
    .openapi({
      description: "リアクションID",
      example: "clxxxxx",
      format: "cuid2",
    }),
})
