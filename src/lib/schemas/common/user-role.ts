import { z } from "@hono/zod-openapi"
import { UserRole } from "@prisma/client"

export const userRoleSchema = z.enum(UserRole).openapi("UserRole")
