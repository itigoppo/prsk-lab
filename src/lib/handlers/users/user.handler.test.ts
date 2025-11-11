import { HTTP_STATUS } from "@/constants/http-status"
import type { User } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUser } from "./create-user.handler"
import { getCurrentUser } from "./get-current-user.handler"

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
      findFirstOrThrow: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("User Handlers", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  describe("GET /user (getCurrentUser)", () => {
    it("discordIdがない場合は401を返す", async () => {
      app.get("/user", getCurrentUser)

      const res = await app.request("/user")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザー情報の取得に失敗しました")
    })

    it("ユーザーが存在する場合はユーザー情報を返す", async () => {
      const mockUser: Pick<User, "id" | "discordId" | "name" | "email" | "avatarUrl" | "role"> = {
        avatarUrl: "https://example.com/avatar.png",
        discordId: "123456789",
        email: "test@example.com",
        id: "user-1",
        name: "Test User",
        role: "Viewer",
      }

      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)

      app.use("*", async (c, next) => {
        c.set("discordId", "123456789")
        await next()
      })
      app.get("/user", getCurrentUser)

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
      const mockUser: Pick<User, "id" | "discordId" | "name" | "email" | "avatarUrl" | "role"> = {
        avatarUrl: null,
        discordId: "123456789",
        email: "test@example.com",
        id: "user-1",
        name: "Test User",
        role: "Viewer",
      }

      vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)

      app.use("*", async (c, next) => {
        c.set("discordId", "123456789")
        await next()
      })
      app.get("/user", getCurrentUser)

      const res = await app.request("/user")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(json.data.avatarUrl).toBeNull()
    })

    it("ユーザーが存在しない場合は500を返す", async () => {
      vi.mocked(prisma.user.findFirstOrThrow).mockRejectedValue(new Error("User not found"))

      app.use("*", async (c, next) => {
        c.set("discordId", "999999999")
        await next()
      })
      app.get("/user", getCurrentUser)

      const res = await app.request("/user")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザー情報の取得に失敗しました")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findFirstOrThrow).mockRejectedValue(new Error("Database error"))

      app.use("*", async (c, next) => {
        c.set("discordId", "123456789")
        await next()
      })
      app.get("/user", getCurrentUser)

      const res = await app.request("/user")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
    })
  })

  describe("POST /user (createUser)", () => {
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
})
