import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser, getCurrentUserRoute } from "./get-current-user.handler"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe("getCurrentUser", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>()
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.openapi(getCurrentUserRoute, getCurrentUser)
    vi.clearAllMocks()
  })

  it("ユーザーが存在する場合はユーザー情報を返す", async () => {
    const mockUser = {
      avatarUrl: "https://example.com/avatar.png",
      discordId: "123456789",
      email: "test@example.com",
      id: "user-1",
      name: "Test User",
      role: "Viewer",
    } as User

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("ユーザー情報を取得しました")
    expect(json.data).toEqual({
      avatarUrl: "https://example.com/avatar.png",
      discordId: "123456789",
      email: "test@example.com",
      id: "user-1",
      name: "Test User",
      role: "Viewer",
    })
  })

  it("avatarUrlがnullの場合も正しく返す", async () => {
    const mockUser = {
      avatarUrl: null,
      discordId: "123456789",
      email: "test@example.com",
      id: "user-1",
      name: "Test User",
      role: "Viewer",
    } as User

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.avatarUrl).toBeNull()
  })

  it("Adminロールのユーザー情報を正しく返す", async () => {
    const mockUser = {
      avatarUrl: "https://example.com/avatar.png",
      discordId: "123456789",
      email: "admin@example.com",
      id: "user-1",
      name: "Admin User",
      role: "Admin",
    } as User

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.role).toBe("Admin")
  })

  it("Editorロールのユーザー情報を正しく返す", async () => {
    const mockUser = {
      avatarUrl: null,
      discordId: "123456789",
      email: null,
      id: "user-2",
      name: "Editor User",
      role: "Editor",
    } as User

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.role).toBe("Editor")
    expect(json.data.avatarUrl).toBeNull()
    expect(json.data.email).toBeNull()
  })

  it("ユーザーが存在しない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/users/me")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
