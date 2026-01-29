import { getCharacters } from "@/lib/handlers/characters/get-characters.handler"
import { createSetting } from "@/lib/handlers/users/create-setting.handler"
import { createUser } from "@/lib/handlers/users/create-user.handler"
import { getCurrentUser } from "@/lib/handlers/users/get-current-user.handler"
import { getSetting } from "@/lib/handlers/users/get-setting.handler"
import { updateSetting } from "@/lib/handlers/users/update-setting.handler"
import { verifyDiscordToken } from "@/lib/middleware/verify-discord-token"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { createSettingDtoSchema, updateSettingDtoSchema } from "@/lib/schemas/dto/setting.dto"
import { characterListResponseSchema } from "@/lib/schemas/response/character.response"
import {
  currentSettingResponseSchema,
  currentUserResponseSchema,
} from "@/lib/schemas/response/user.response"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Handler, MiddlewareHandler } from "hono"
import type { z } from "zod"

const app = new OpenAPIHono()

// タグ定義（名前と説明をセットで管理）
const Tags = {
  CHARACTERS: {
    description: "Character and unit information",
    name: "Characters",
  },
  SETTINGS: {
    description: "User settings management",
    name: "Settings",
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

// Register routes with actual handlers and middleware
// 構造化されたルート登録でパス重複を削減
type RouteDefinition = {
  handler: Handler
  middleware?: MiddlewareHandler
  route: ReturnType<typeof createRoute>
}

const routes: RouteDefinition[] = [
  // Users
  {
    handler: getCurrentUser,
    middleware: verifyNextAuthSession,
    route: getCurrentUserRoute,
  },
  {
    handler: createUser,
    middleware: verifyDiscordToken(),
    route: createUserRoute,
  },
  // Settings
  {
    handler: getSetting,
    middleware: verifyNextAuthSession,
    route: getSettingRoute,
  },
  {
    handler: createSetting,
    middleware: verifyNextAuthSession,
    route: createSettingRoute,
  },
  {
    handler: updateSetting,
    middleware: verifyNextAuthSession,
    route: updateSettingRoute,
  },
  // Characters
  {
    handler: getCharacters,
    route: getCharactersRoute,
  },
]

// ミドルウェアとハンドラーを一括登録
routes.forEach(({ handler, middleware, route }) => {
  if (middleware) {
    app.use(route.path, middleware)
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
