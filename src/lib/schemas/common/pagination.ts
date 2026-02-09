import { z } from "zod"

/**
 * ページネーションメタデータ
 */
export const paginationMetaSchema = z.object({
  limit: z.number().int().positive(),
  page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

/**
 * ページネーションクエリパラメータ
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
})

export type PaginationMeta = z.infer<typeof paginationMetaSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
