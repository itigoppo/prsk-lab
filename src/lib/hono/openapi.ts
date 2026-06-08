import { swaggerUI } from "@hono/swagger-ui"
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { Handler, MiddlewareHandler } from "hono"

// Import middlewares
import { requireEditorOrAdmin } from "@/lib/middleware/require-role"
import { verifyDiscordToken } from "@/lib/middleware/verify-discord-token"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"

// Import handlers
import { HTTP_STATUS } from "@/constants/http-status"
import {
  getAdminCharacters,
  getAdminFurnitureCharactersRoute,
} from "@/lib/handlers/admin/characters/get-admin-characters.handler"
import {
  createFurnitureGroup,
  createFurnitureGroupRoute,
} from "@/lib/handlers/admin/furnitures/create-furniture-group.handler"
import {
  createFurnitureTag,
  createFurnitureTagRoute,
} from "@/lib/handlers/admin/furnitures/create-furniture-tag.handler"
import {
  deleteFurnitureGroup,
  deleteFurnitureGroupRoute,
} from "@/lib/handlers/admin/furnitures/delete-furniture-group.handler"
import {
  deleteFurnitureTag,
  deleteFurnitureTagRoute,
} from "@/lib/handlers/admin/furnitures/delete-furniture-tag.handler"
import {
  getFurnitureGroup,
  getFurnitureGroupRoute,
} from "@/lib/handlers/admin/furnitures/get-furniture-group.handler"
import {
  getFurnitureGroups,
  getFurnitureGroupsRoute,
} from "@/lib/handlers/admin/furnitures/get-furniture-groups.handler"
import {
  getFurnitureTag,
  getFurnitureTagRoute,
} from "@/lib/handlers/admin/furnitures/get-furniture-tag.handler"
import {
  getFurnitureTags,
  getFurnitureTagsRoute,
} from "@/lib/handlers/admin/furnitures/get-furniture-tags.handler"
import {
  reorderFurnitureGroups,
  reorderFurnitureGroupsRoute,
} from "@/lib/handlers/admin/furnitures/reorder-furniture-groups.handler"
import {
  reorderFurnitureTags,
  reorderFurnitureTagsRoute,
} from "@/lib/handlers/admin/furnitures/reorder-furniture-tags.handler"
import {
  updateFurnitureGroup,
  updateFurnitureGroupRoute,
} from "@/lib/handlers/admin/furnitures/update-furniture-group.handler"
import {
  updateFurnitureTag,
  updateFurnitureTagRoute,
} from "@/lib/handlers/admin/furnitures/update-furniture-tag.handler"
import { getCharacters, getCharactersRoute } from "@/lib/handlers/characters/get-characters.handler"
import {
  getFurnituresByUnit,
  getFurnituresByUnitRoute,
} from "@/lib/handlers/furnitures/get-furnitures-by-unit.handler"
import { getFurnitures, getFurnituresRoute } from "@/lib/handlers/furnitures/get-furnitures.handler"
import { ownFurniture, ownFurnitureRoute } from "@/lib/handlers/furnitures/own-furniture.handler"
import {
  unownFurniture,
  unownFurnitureRoute,
} from "@/lib/handlers/furnitures/unown-furniture.handler"
import { checkReaction, checkReactionRoute } from "@/lib/handlers/reactions/check-reaction.handler"
import {
  uncheckReaction,
  uncheckReactionRoute,
} from "@/lib/handlers/reactions/uncheck-reaction.handler"
import { getUnits, getUnitsRoute } from "@/lib/handlers/units/get-units.handler"
import { createSetting, createSettingRoute } from "@/lib/handlers/users/create-setting.handler"
import { createUser, createUserRoute } from "@/lib/handlers/users/create-user.handler"
import { getCurrentUser, getCurrentUserRoute } from "@/lib/handlers/users/get-current-user.handler"
import { getSetting, getSettingRoute } from "@/lib/handlers/users/get-setting.handler"
import { updateSetting, updateSettingRoute } from "@/lib/handlers/users/update-setting.handler"
import { formatZodErrors } from "@/lib/utils/zod"
import { Tags } from "./openapi-helpers"

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          errors: formatZodErrors(result.error),
          message: "入力内容に誤りがあります",
          success: false,
        },
        HTTP_STATUS.BAD_REQUEST
      )
    }
  },
})

// Register routes with actual handlers and middleware
type RouteDefinition = {
  handler: Handler
  middlewares?: MiddlewareHandler[]
  route: ReturnType<typeof createRoute>
}

const routes: RouteDefinition[] = [
  // Users
  {
    handler: getCurrentUser,
    middlewares: [verifyNextAuthSession],
    route: getCurrentUserRoute,
  },
  {
    handler: createUser,
    middlewares: [verifyDiscordToken()],
    route: createUserRoute,
  },
  // Settings
  {
    handler: getSetting,
    middlewares: [verifyNextAuthSession],
    route: getSettingRoute,
  },
  {
    handler: createSetting,
    middlewares: [verifyNextAuthSession],
    route: createSettingRoute,
  },
  {
    handler: updateSetting,
    middlewares: [verifyNextAuthSession],
    route: updateSettingRoute,
  },
  // Characters
  {
    handler: getCharacters,
    route: getCharactersRoute,
  },
  // Units
  {
    handler: getUnits,
    route: getUnitsRoute,
  },
  // Furnitures
  {
    handler: getFurnitures,
    middlewares: [verifyNextAuthSession],
    route: getFurnituresRoute,
  },
  {
    handler: getFurnituresByUnit,
    middlewares: [verifyNextAuthSession],
    route: getFurnituresByUnitRoute,
  },
  {
    handler: ownFurniture,
    middlewares: [verifyNextAuthSession],
    route: ownFurnitureRoute,
  },
  {
    handler: unownFurniture,
    middlewares: [verifyNextAuthSession],
    route: unownFurnitureRoute,
  },
  // Reactions
  {
    handler: checkReaction,
    middlewares: [verifyNextAuthSession],
    route: checkReactionRoute,
  },
  {
    handler: uncheckReaction,
    middlewares: [verifyNextAuthSession],
    route: uncheckReactionRoute,
  },
  // Admin - Furniture Characters
  {
    handler: getAdminCharacters,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: getAdminFurnitureCharactersRoute,
  },
  // Admin - Furniture Tags
  {
    handler: createFurnitureTag,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: createFurnitureTagRoute,
  },
  {
    handler: reorderFurnitureTags,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: reorderFurnitureTagsRoute,
  },
  {
    handler: getFurnitureTags,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: getFurnitureTagsRoute,
  },
  {
    handler: getFurnitureTag,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: getFurnitureTagRoute,
  },
  {
    handler: updateFurnitureTag,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: updateFurnitureTagRoute,
  },
  {
    handler: deleteFurnitureTag,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: deleteFurnitureTagRoute,
  },
  // Admin - Furniture Groups
  {
    handler: createFurnitureGroup,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: createFurnitureGroupRoute,
  },
  {
    handler: getFurnitureGroups,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: getFurnitureGroupsRoute,
  },
  {
    handler: reorderFurnitureGroups,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: reorderFurnitureGroupsRoute,
  },
  {
    handler: getFurnitureGroup,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: getFurnitureGroupRoute,
  },
  {
    handler: updateFurnitureGroup,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: updateFurnitureGroupRoute,
  },
  {
    handler: deleteFurnitureGroup,
    middlewares: [verifyNextAuthSession, requireEditorOrAdmin],
    route: deleteFurnitureGroupRoute,
  },
]

// OpenAPIパス形式をHonoパス形式に変換（{param} -> :param）
const convertPathToHonoFormat = (openApiPath: string): string =>
  openApiPath.replace(/\{(\w+)\}/g, ":$1")

// ミドルウェアとハンドラーを一括登録
routes.forEach(({ handler, middlewares, route }) => {
  if (middlewares && middlewares.length > 0) {
    const honoPath = convertPathToHonoFormat(route.path)
    for (const mw of middlewares) {
      app.use(honoPath, mw)
    }
  }
  app.openapi(route, handler)
})

// OpenAPI documentation
app.doc("/api/openapi.json", {
  info: {
    description: "API for PrskLab - Project SEKAI related web application",
    title: "PrskLab API",
    version: "1.0.0",
  },
  openapi: "3.0.0",
  servers: [
    {
      description: "Local development server",
      url: process.env.NEXTAUTH_URL || "http://localhost:30000",
    },
  ],
  tags: Object.values(Tags),
})

// Register security schemes
app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
  description: "NextAuth session token (automatically sent via Browser)",
  in: "cookie",
  name: "next-auth.session-token",
  type: "apiKey",
})

app.openAPIRegistry.registerComponent("securitySchemes", "discordAuth", {
  description: "Discord OAuth token",
  in: "header",
  name: "X-Discord-Token",
  type: "apiKey",
})

// Swagger UI
app.get(
  "/api/docs",
  swaggerUI({
    url: "/api/openapi.json",
  })
)

export default app
export { app as openAPIApp }
