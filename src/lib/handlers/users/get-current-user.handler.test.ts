import { HTTP_STATUS } from "@/constants/http-status"
import type { User } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "./get-current-user.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirstOrThrow: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getCurrentUser", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.get("/user", getCurrentUser)
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

    vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)

    const res = await app.request("/user")
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

    vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)

    const res = await app.request("/user")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.avatarUrl).toBeNull()
  })

  it("ユーザーが存在しない場合は500を返す", async () => {
    vi.mocked(prisma.user.findFirstOrThrow).mockRejectedValue(new Error("User not found"))

    const res = await app.request("/user")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("ユーザー情報の取得に失敗しました")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findFirstOrThrow).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/user")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
