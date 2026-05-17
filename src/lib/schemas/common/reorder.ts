import { z } from "@hono/zod-openapi"

export const REORDER_DIRECTION = {
  DOWN: "down",
  UP: "up",
} as const

export type ReorderDirection = (typeof REORDER_DIRECTION)[keyof typeof REORDER_DIRECTION]

export const reorderDirectionSchema = z
  .enum([REORDER_DIRECTION.UP, REORDER_DIRECTION.DOWN], {
    message: "移動方向（upまたはdown）を指定してください",
  })
  .openapi("ReorderDirection")
