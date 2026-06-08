import { HTTP_STATUS } from "@/constants/http-status"
import { z } from "zod"

// タグ定義（名前と説明をセットで管理）
export const Tags = {
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
export const commonResponses = {
  badRequest: {
    [HTTP_STATUS.BAD_REQUEST]: {
      description: "Bad request - Invalid input data",
    },
  },
  conflict: {
    [HTTP_STATUS.CONFLICT]: {
      description: "Conflict - Resource already exists",
    },
  },
  forbidden: {
    [HTTP_STATUS.FORBIDDEN]: {
      description: "Forbidden - Insufficient permissions",
    },
  },
  internalServerError: {
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
      description: "Internal server error",
    },
  },
  notFound: {
    [HTTP_STATUS.NOT_FOUND]: {
      description: "Not found",
    },
  },
  unauthorized: {
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: "Unauthorized - Authentication required",
    },
  },
} as const

// JSONレスポンス生成ヘルパー
export const jsonResponse = <T extends z.ZodTypeAny>(
  status: (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS],
  schema: T,
  description: string
) => ({
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
export const jsonRequest = <T extends z.ZodTypeAny>(schema: T) => ({
  body: {
    content: {
      "application/json": {
        schema,
      },
    },
  },
})

// 共通セキュリティ定義
export const cookieAuth = { cookieAuth: [] }
export const discordAuth = { discordAuth: [] }
