import { Prisma } from "@prisma/client"

export const FURNITURE_GROUP_LIST_ORDER_BY = [
  { priority: Prisma.SortOrder.asc },
  { createdAt: Prisma.SortOrder.asc },
]

export const FURNITURE_TAG_LIST_ORDER_BY = [
  { priority: Prisma.SortOrder.asc },
  { createdAt: Prisma.SortOrder.asc },
]
