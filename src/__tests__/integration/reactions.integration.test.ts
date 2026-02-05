import { HTTP_STATUS } from "@/constants/http-status"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureReaction: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userReactionCheck: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

// NextAuth セッション検証ミドルウェアをモック
import type { Context, Next } from "hono"

const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"

describe("Reactions Integration Tests", () => {
  const MOCK_DISCORD_ID = "discord-123456"
  const MOCK_SESSION_TOKEN = "mock_session_token"

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  describe("POST /api/reactions/{reactionId}/check", () => {
    it("認証済みユーザーがリアクションをチェックできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValueOnce({
        id: "reaction-1",
      } as never)
      vi.mocked(prisma.userReactionCheck.upsert).mockResolvedValueOnce({
        id: "check-1",
        reactionId: "reaction-1",
        userId: "user-1",
      } as never)

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(true)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it("リアクションが存在しない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValueOnce(null)

      const res = await openAPIApp.request("/api/reactions/invalid-reaction/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "POST",
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)

      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })

  describe("DELETE /api/reactions/{reactionId}/check", () => {
    it("認証済みユーザーがリアクションのチェックを解除できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        headers: {
          Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
        },
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(false)
    })

    it("認証失敗時は401を返す", async () => {
      mockVerifyNextAuthSession.mockImplementation(async (c) => {
        return c.json({ message: "Missing session token", success: false }, 401)
      })

      const res = await openAPIApp.request("/api/reactions/reaction-1/check", {
        method: "DELETE",
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })
  })
})
