import { HTTP_STATUS } from "@/constants/http-status"
import type { User } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUser } from "./create-user.handler"

type DiscordUser = {
  avatar?: string | null
  email?: string | null
  id: string
  username?: string | null
}

type Env = {
  Variables: {
    discordId: string
    discordUser: DiscordUser
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("createUser", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  it("新規ユーザーを作成できる", async () => {
    const discordUser: DiscordUser = {
      avatar: "abc123",
      email: "test@example.com",
      id: "123456789",
      username: "TestUser",
    }

    const mockUser: User = {
      avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
      createdAt: new Date(),
      discordId: "123456789",
      email: "test@example.com",
      id: "user-1",
      lastLoginAt: new Date(),
      name: "TestUser",
      role: "Viewer",
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser)

    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      c.set("discordUser", discordUser)
      await next()
    })
    app.post("/user", createUser)

    const res = await app.request("/user", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.message).toBe("ユーザー登録が完了しました")

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
          discordId: "123456789",
          email: "test@example.com",
          name: "TestUser",
          role: "Viewer",
        }),
        update: expect.objectContaining({
          avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
          email: "test@example.com",
          name: "TestUser",
        }),
        where: { discordId: "123456789" },
      })
    )
  })

  it("avatarがない場合はnullになる", async () => {
    const discordUser: DiscordUser = {
      avatar: null,
      email: "test@example.com",
      id: "123456789",
      username: "TestUser",
    }

    const mockUser: User = {
      avatarUrl: null,
      createdAt: new Date(),
      discordId: "123456789",
      email: "test@example.com",
      id: "user-1",
      lastLoginAt: new Date(),
      name: "TestUser",
      role: "Viewer",
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser)

    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      c.set("discordUser", discordUser)
      await next()
    })
    app.post("/user", createUser)

    const res = await app.request("/user", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          avatarUrl: null,
        }),
      })
    )
  })

  it("emailやusernameがnullでも作成できる", async () => {
    const discordUser: DiscordUser = {
      avatar: null,
      email: null,
      id: "123456789",
      username: null,
    }

    const mockUser: User = {
      avatarUrl: null,
      createdAt: new Date(),
      discordId: "123456789",
      email: null,
      id: "user-1",
      lastLoginAt: new Date(),
      name: null,
      role: "Viewer",
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser)

    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      c.set("discordUser", discordUser)
      await next()
    })
    app.post("/user", createUser)

    const res = await app.request("/user", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
  })

  it("既存ユーザーの場合は更新される", async () => {
    const discordUser: DiscordUser = {
      avatar: "newavatar",
      email: "updated@example.com",
      id: "123456789",
      username: "UpdatedUser",
    }

    const mockUser: User = {
      avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
      createdAt: new Date("2023-01-01"),
      discordId: "123456789",
      email: "updated@example.com",
      id: "user-1",
      lastLoginAt: new Date(),
      name: "UpdatedUser",
      role: "Viewer",
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser)

    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      c.set("discordUser", discordUser)
      await next()
    })
    app.post("/user", createUser)

    const res = await app.request("/user", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)

    // updateフィールドが正しく呼ばれていることを確認
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          email: "updated@example.com",
          name: "UpdatedUser",
        }),
      })
    )
  })

  it("データベースエラーの場合は500を返す", async () => {
    const discordUser: DiscordUser = {
      avatar: "abc123",
      email: "test@example.com",
      id: "123456789",
      username: "TestUser",
    }

    vi.mocked(prisma.user.upsert).mockRejectedValue(new Error("Database error"))

    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      c.set("discordUser", discordUser)
      await next()
    })
    app.post("/user", createUser)

    const res = await app.request("/user", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("登録中にエラーが発生しました")
  })
})
