import { getAdminCharacters } from "@/lib/handlers/admin/characters/get-admin-characters.handler"
import { createFurnitureGroup } from "@/lib/handlers/admin/furnitures/create-furniture-group.handler"
import { createFurnitureTag } from "@/lib/handlers/admin/furnitures/create-furniture-tag.handler"
import { deleteFurnitureGroup } from "@/lib/handlers/admin/furnitures/delete-furniture-group.handler"
import { deleteFurnitureTag } from "@/lib/handlers/admin/furnitures/delete-furniture-tag.handler"
import { getFurnitureGroup } from "@/lib/handlers/admin/furnitures/get-furniture-group.handler"
import { getFurnitureGroups } from "@/lib/handlers/admin/furnitures/get-furniture-groups.handler"
import { getFurnitureTag } from "@/lib/handlers/admin/furnitures/get-furniture-tag.handler"
import { getFurnitureTags } from "@/lib/handlers/admin/furnitures/get-furniture-tags.handler"
import { updateFurnitureGroup } from "@/lib/handlers/admin/furnitures/update-furniture-group.handler"
import { updateFurnitureTag } from "@/lib/handlers/admin/furnitures/update-furniture-tag.handler"
import { getCharacters } from "@/lib/handlers/characters/get-characters.handler"
import { getFurnituresByUnit } from "@/lib/handlers/furnitures/get-furnitures-by-unit.handler"
import { getFurnitures } from "@/lib/handlers/furnitures/get-furnitures.handler"
import { ownFurniture } from "@/lib/handlers/furnitures/own-furniture.handler"
import { unownFurniture } from "@/lib/handlers/furnitures/unown-furniture.handler"
import { checkReaction } from "@/lib/handlers/reactions/check-reaction.handler"
import { uncheckReaction } from "@/lib/handlers/reactions/uncheck-reaction.handler"
import { createSetting } from "@/lib/handlers/users/create-setting.handler"
import { createUser } from "@/lib/handlers/users/create-user.handler"
import { getCurrentUser } from "@/lib/handlers/users/get-current-user.handler"
import { getSetting } from "@/lib/handlers/users/get-setting.handler"
import { updateSetting } from "@/lib/handlers/users/update-setting.handler"
import { requireEditorOrAdmin } from "@/lib/middleware/require-role"
import { verifyDiscordToken } from "@/lib/middleware/verify-discord-token"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import {
  createFurnitureGroupDtoSchema,
  updateFurnitureGroupDtoSchema,
} from "@/lib/schemas/dto/admin/furniture-group.dto"
import {
  createFurnitureTagDtoSchema,
  updateFurnitureTagDtoSchema,
} from "@/lib/schemas/dto/admin/furniture-tag.dto"
import { createSettingDtoSchema, updateSettingDtoSchema } from "@/lib/schemas/dto/setting.dto"
import { adminCharacterListResponseSchema } from "@/lib/schemas/response/admin/character.response"
import {
  createFurnitureGroupResponseSchema,
  deleteFurnitureGroupResponseSchema,
  getFurnitureGroupResponseSchema,
  getFurnitureGroupsResponseSchema,
  updateFurnitureGroupResponseSchema,
} from "@/lib/schemas/response/admin/furniture-group.response"
import {
  createFurnitureTagResponseSchema,
  deleteFurnitureTagResponseSchema,
  getFurnitureTagResponseSchema,
  getFurnitureTagsResponseSchema,
  updateFurnitureTagResponseSchema,
} from "@/lib/schemas/response/admin/furniture-tag.response"
import { characterListResponseSchema } from "@/lib/schemas/response/character.response"
import {
  furnitureListResponseSchema,
  furnitureOwnershipListResponseSchema,
  furnitureOwnershipResponseSchema,
} from "@/lib/schemas/response/furniture.response"
import { reactionCheckResponseSchema } from "@/lib/schemas/response/reaction.response"
import {
  currentSettingResponseSchema,
  currentUserResponseSchema,
} from "@/lib/schemas/response/user.response"
import { formatZodErrors } from "@/lib/utils/zod"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Handler, MiddlewareHandler } from "hono"
import { z } from "zod"
import { getUnits } from "../handlers/units/get-units.handler"
import { unitListResponseSchema } from "../schemas/response/unit.response"

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          errors: formatZodErrors(result.error),
          message: "入力内容に誤りがあります",
          success: false,
        },
        400
      )
    }
  },
})

// タグ定義（名前と説明をセットで管理）
const Tags = {
  ADMIN_FURNITURES: {
    description: "Admin endpoints for furniture management (Editor/Admin only)",
    name: "Admin - Furnitures",
  },
  CHARACTERS: {
    description: "Character and unit information",
    name: "Characters",
  },
  FURNITURES: {
    description: "Furniture and reaction information",
    name: "Furnitures",
  },
  REACTIONS: {
    description: "Reaction check management",
    name: "Reactions",
  },
  SETTINGS: {
    description: "User settings management",
    name: "Settings",
  },
  UNITS: {
    description: "Unit information",
    name: "Units",
  },
  USERS: {
    description: "User management endpoints",
    name: "Users",
  },
} as const

// 共通レスポンス定義
const commonResponses = {
  badRequest: {
    400: {
      description: "Bad request - Invalid input data",
    },
  },
  conflict: {
    409: {
      description: "Conflict - Resource already exists",
    },
  },
  forbidden: {
    403: {
      description: "Forbidden - Insufficient permissions",
    },
  },
  internalServerError: {
    500: {
      description: "Internal server error",
    },
  },
  notFound: {
    404: {
      description: "Not found",
    },
  },
  unauthorized: {
    401: {
      description: "Unauthorized - Authentication required",
    },
  },
} as const

// JSONレスポンス生成ヘルパー
const jsonResponse = <T extends z.ZodTypeAny>(status: number, schema: T, description: string) => ({
  [status]: {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  },
})

// JSONリクエストボディ生成ヘルパー
const jsonRequest = <T extends z.ZodTypeAny>(schema: T) => ({
  body: {
    content: {
      "application/json": {
        schema,
      },
    },
  },
})

// 共通セキュリティ定義
const bearerAuth = { bearerAuth: [] }
const discordAuth = { discordAuth: [] }

// Routes definition
const getCurrentUserRoute = createRoute({
  description: "Get the currently authenticated user's information",
  method: "get",
  path: "/api/users/me",
  responses: {
    ...jsonResponse(200, currentUserResponseSchema, "User found"),
    ...commonResponses.unauthorized,
    ...commonResponses.notFound,
  },
  security: [bearerAuth],
  summary: "Get current user",
  tags: [Tags.USERS.name],
})

const createUserRoute = createRoute({
  description: "Register a new user with Discord OAuth",
  method: "post",
  path: "/api/users",
  // request bodyは不要（ミドルウェアがDiscord APIから情報を取得）
  responses: {
    ...jsonResponse(201, currentUserResponseSchema, "User created successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.conflict,
  },
  security: [discordAuth],
  summary: "Create a new user",
  tags: [Tags.USERS.name],
})

const getSettingRoute = createRoute({
  description: "Get the current user's settings",
  method: "get",
  path: "/api/users/settings",
  responses: {
    ...jsonResponse(200, currentSettingResponseSchema, "Settings found"),
    ...commonResponses.unauthorized,
    ...commonResponses.notFound,
  },
  security: [bearerAuth],
  summary: "Get user settings",
  tags: [Tags.SETTINGS.name],
})

const createSettingRoute = createRoute({
  description: "Create new settings for the current user",
  method: "post",
  path: "/api/users/settings",
  request: jsonRequest(createSettingDtoSchema),
  responses: {
    ...jsonResponse(201, currentSettingResponseSchema, "Settings created successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.conflict,
  },
  security: [bearerAuth],
  summary: "Create user settings",
  tags: [Tags.SETTINGS.name],
})

const updateSettingRoute = createRoute({
  description: "Update the current user's settings",
  method: "patch",
  path: "/api/users/settings",
  request: jsonRequest(updateSettingDtoSchema),
  responses: {
    ...jsonResponse(200, currentSettingResponseSchema, "Settings updated successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.notFound,
  },
  security: [bearerAuth],
  summary: "Update user settings",
  tags: [Tags.SETTINGS.name],
})

const getCharactersRoute = createRoute({
  description: "Retrieve all characters with their unit information",
  method: "get",
  path: "/api/characters",
  responses: {
    ...jsonResponse(200, characterListResponseSchema, "Characters retrieved successfully"),
    ...commonResponses.internalServerError,
  },
  summary: "Get all characters",
  tags: [Tags.CHARACTERS.name],
})

const getUnitsRoute = createRoute({
  description: "Retrieve all units",
  method: "get",
  path: "/api/units",
  responses: {
    ...jsonResponse(200, unitListResponseSchema, "Units retrieved successfully"),
    ...commonResponses.internalServerError,
  },
  summary: "Get all units",
  tags: [Tags.UNITS.name],
})

const getFurnituresByUnitRoute = createRoute({
  description: "Retrieve furniture list with reactions for a specific unit",
  method: "get",
  path: "/api/furnitures/{unitCode}",
  request: {
    params: z.object({
      unitCode: z.string().openapi({
        description: "Unit code (e.g., leoneed, mmj, vbs, ws, oclock)",
        example: "leoneed",
      }),
    }),
    query: z.object({
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
    }),
  },
  responses: {
    ...jsonResponse(200, furnitureListResponseSchema, "Furnitures retrieved successfully"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Get furnitures by unit",
  tags: [Tags.FURNITURES.name],
})

const getFurnituresRoute = createRoute({
  description: "Retrieve all furnitures with ownership status for the current user",
  method: "get",
  path: "/api/furnitures",
  request: {
    query: z.object({
      q: z.string().optional().openapi({
        description: "Search query for furniture name (partial match)",
        example: "ソファ",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipListResponseSchema, "Furnitures retrieved successfully"),
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Get all furnitures with ownership status",
  tags: [Tags.FURNITURES.name],
})

const ownFurnitureRoute = createRoute({
  description: "Mark a furniture as owned by the current user",
  method: "post",
  path: "/api/furnitures/own/{furnitureId}",
  request: {
    params: z.object({
      furnitureId: z.string().openapi({
        description: "Furniture ID",
        example: "clxxxxx",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipResponseSchema, "Furniture marked as owned"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Own a furniture",
  tags: [Tags.FURNITURES.name],
})

const unownFurnitureRoute = createRoute({
  description: "Remove ownership of a furniture for the current user",
  method: "delete",
  path: "/api/furnitures/own/{furnitureId}",
  request: {
    params: z.object({
      furnitureId: z.string().openapi({
        description: "Furniture ID",
        example: "clxxxxx",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, furnitureOwnershipResponseSchema, "Furniture ownership removed"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Unown a furniture",
  tags: [Tags.FURNITURES.name],
})

const checkReactionRoute = createRoute({
  description: "Mark a reaction as checked for the current user",
  method: "post",
  path: "/api/reactions/{reactionId}/check",
  request: {
    params: z.object({
      reactionId: z.string().openapi({
        description: "Reaction ID",
        example: "clxxxxx",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, reactionCheckResponseSchema, "Reaction checked successfully"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Check a reaction",
  tags: [Tags.REACTIONS.name],
})

const uncheckReactionRoute = createRoute({
  description: "Remove check from a reaction for the current user",
  method: "delete",
  path: "/api/reactions/{reactionId}/check",
  request: {
    params: z.object({
      reactionId: z.string().openapi({
        description: "Reaction ID",
        example: "clxxxxx",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, reactionCheckResponseSchema, "Reaction unchecked successfully"),
    ...commonResponses.notFound,
    ...commonResponses.internalServerError,
    ...commonResponses.unauthorized,
  },
  security: [bearerAuth],
  summary: "Uncheck a reaction",
  tags: [Tags.REACTIONS.name],
})

// ==================== Admin Routes ====================

// Admin Furniture Character Routes
const getAdminFurnitureCharactersRoute = createRoute({
  description: "Retrieve all characters with their IDs for furniture admin use",
  method: "get",
  path: "/api/admin/furniture-characters",
  responses: {
    ...jsonResponse(200, adminCharacterListResponseSchema, "Characters retrieved successfully"),
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Get all characters for furniture management",
  tags: [Tags.ADMIN_FURNITURES.name],
})

// Furniture Tag Routes
const createFurnitureTagRoute = createRoute({
  description: "Create a new furniture tag with optional furnitures (bulk creation)",
  method: "post",
  path: "/api/admin/furniture-tags",
  request: jsonRequest(createFurnitureTagDtoSchema),
  responses: {
    ...jsonResponse(201, createFurnitureTagResponseSchema, "Tag created successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Create furniture tag",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const getFurnitureTagsRoute = createRoute({
  description: "Get all furniture tags with furniture count",
  method: "get",
  path: "/api/admin/furniture-tags",
  request: {
    query: z.object({
      limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .default(20)
        .openapi({ description: "Number of items per page", example: 20 }),
      page: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(1)
        .openapi({ description: "Page number", example: 1 }),
      q: z.string().optional().openapi({
        description: "Search query for tag name (partial match, case insensitive)",
        example: "フラワー",
      }),
    }),
  },
  responses: {
    ...jsonResponse(200, getFurnitureTagsResponseSchema, "Tags retrieved successfully"),
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "List furniture tags",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const getFurnitureTagRoute = createRoute({
  description: "Get a furniture tag with its furnitures and reactions",
  method: "get",
  path: "/api/admin/furniture-tags/{tagId}",
  request: {
    params: z.object({
      tagId: z.string().openapi({ description: "Tag ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, getFurnitureTagResponseSchema, "Tag retrieved successfully"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Get furniture tag",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const updateFurnitureTagRoute = createRoute({
  description: "Update a furniture tag with its furnitures and reactions",
  method: "patch",
  path: "/api/admin/furniture-tags/{tagId}",
  request: {
    ...jsonRequest(updateFurnitureTagDtoSchema),
    params: z.object({
      tagId: z.string().openapi({ description: "Tag ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, updateFurnitureTagResponseSchema, "Tag updated successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.notFound,
    ...commonResponses.conflict,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Update furniture tag",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const deleteFurnitureTagRoute = createRoute({
  description: "Delete a furniture tag and all its furnitures (cascade)",
  method: "delete",
  path: "/api/admin/furniture-tags/{tagId}",
  request: {
    params: z.object({
      tagId: z.string().openapi({ description: "Tag ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, deleteFurnitureTagResponseSchema, "Tag deleted successfully"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Delete furniture tag",
  tags: [Tags.ADMIN_FURNITURES.name],
})

// Furniture Group Routes
const createFurnitureGroupRoute = createRoute({
  description: "Create a new furniture group with optional excluded character combinations",
  method: "post",
  path: "/api/admin/furniture-groups",
  request: jsonRequest(createFurnitureGroupDtoSchema),
  responses: {
    ...jsonResponse(201, createFurnitureGroupResponseSchema, "Group created successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Create furniture group",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const getFurnitureGroupsRoute = createRoute({
  description: "Get all furniture groups",
  method: "get",
  path: "/api/admin/furniture-groups",
  request: {
    query: z.object({
      limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .default(20)
        .openapi({ description: "Number of items per page", example: 20 }),
      page: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(1)
        .openapi({ description: "Page number", example: 1 }),
    }),
  },
  responses: {
    ...jsonResponse(200, getFurnitureGroupsResponseSchema, "Groups retrieved successfully"),
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "List furniture groups",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const getFurnitureGroupRoute = createRoute({
  description: "Get a furniture group with excluded combinations and furnitures",
  method: "get",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    params: z.object({
      groupId: z.string().openapi({ description: "Group ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, getFurnitureGroupResponseSchema, "Group retrieved successfully"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Get furniture group detail",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const updateFurnitureGroupRoute = createRoute({
  description:
    "Update a furniture group. If excludedCombinations are provided, they replace existing ones.",
  method: "patch",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    ...jsonRequest(updateFurnitureGroupDtoSchema),
    params: z.object({
      groupId: z.string().openapi({ description: "Group ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, updateFurnitureGroupResponseSchema, "Group updated successfully"),
    ...commonResponses.badRequest,
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Update furniture group",
  tags: [Tags.ADMIN_FURNITURES.name],
})

const deleteFurnitureGroupRoute = createRoute({
  description: "Delete a furniture group (furnitures will have groupId set to null)",
  method: "delete",
  path: "/api/admin/furniture-groups/{groupId}",
  request: {
    params: z.object({
      groupId: z.string().openapi({ description: "Group ID", example: "clxxxxx" }),
    }),
  },
  responses: {
    ...jsonResponse(200, deleteFurnitureGroupResponseSchema, "Group deleted successfully"),
    ...commonResponses.notFound,
    ...commonResponses.unauthorized,
    ...commonResponses.forbidden,
    ...commonResponses.internalServerError,
  },
  security: [bearerAuth],
  summary: "Delete furniture group",
  tags: [Tags.ADMIN_FURNITURES.name],
})

// Register routes with actual handlers and middleware
// 構造化されたルート登録でパス重複を削減
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
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  bearerFormat: "JWT",
  description: "NextAuth session token",
  scheme: "bearer",
  type: "http",
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
