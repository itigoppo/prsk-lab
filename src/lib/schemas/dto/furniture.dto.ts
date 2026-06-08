import { z } from "zod"

export const furnitureUnitParamDtoSchema = z.object({
  unitCode: z.string().openapi({
    description: "Unit code (e.g., leoneed, mmj, vbs, ws, oclock)",
    example: "leoneed",
  }),
})

export const furnitureQueryDtoSchema = z.object({
  characterIds: z.string().optional().openapi({
    description: "Comma-separated character IDs to filter reactions",
    example: "char-id-1,char-id-2",
  }),
  hideCompleted: z.string().optional().openapi({
    description: "Hide tags where all reactions are checked (true/false)",
    example: "true",
  }),
  ownedOnly: z.string().optional().openapi({
    description: "Show only owned furniture (true/false)",
    example: "true",
  }),
  q: z.string().optional().openapi({
    description: "Search query for furniture name (partial match)",
    example: "ソファ",
  }),
})

export const furnitureSearchQueryDtoSchema = z.object({
  q: z.string().optional().openapi({
    description: "Search query for furniture name (partial match)",
    example: "ソファ",
  }),
})

export const furnitureParamDtoSchema = z.object({
  furnitureId: z
    .string()
    .regex(/^[a-z0-9]+$/, "不正なIDフォーマットです")
    .openapi({
      description: "Furniture ID",
      example: "clxxxxx",
      format: "cuid2",
    }),
})
