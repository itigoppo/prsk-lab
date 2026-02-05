import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkReaction } from "./check-reaction.handler"
import { uncheckReaction } from "./uncheck-reaction.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

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

import { prisma } from "@/lib/prisma"

describe("Reaction Handlers", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    vi.clearAllMocks()
  })

  describe("POST /reactions/:reactionId/check (checkReaction)", () => {
    it("リアクションをチェックできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
        id: "reaction-1",
      } as never)
      vi.mocked(prisma.userReactionCheck.upsert).mockResolvedValue({
        id: "check-1",
        reactionId: "reaction-1",
        userId: "user-1",
      } as never)

      app.post("/reactions/:reactionId/check", checkReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "POST",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(json.success).toBe(true)
      expect(json.message).toBe("リアクションをチェックしました")
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(true)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.post("/reactions/:reactionId/check", checkReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "POST",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("リアクションが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue(null)

      app.post("/reactions/:reactionId/check", checkReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "POST",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("リアクションが見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.post("/reactions/:reactionId/check", checkReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "POST",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("リアクションのチェックに失敗しました")
    })
  })

  describe("DELETE /reactions/:reactionId/check (uncheckReaction)", () => {
    it("リアクションのチェックを解除できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValue({ count: 1 } as never)

      app.delete("/reactions/:reactionId/check", uncheckReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "DELETE",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(json.success).toBe(true)
      expect(json.message).toBe("リアクションのチェックを解除しました")
      expect(json.data.reactionId).toBe("reaction-1")
      expect(json.data.checked).toBe(false)
    })

    it("チェックが存在しなくても成功を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValue({ count: 0 } as never)

      app.delete("/reactions/:reactionId/check", uncheckReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "DELETE",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(json.success).toBe(true)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.delete("/reactions/:reactionId/check", uncheckReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "DELETE",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.delete("/reactions/:reactionId/check", uncheckReaction)

      const res = await app.request("/reactions/reaction-1/check", {
        method: "DELETE",
      })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("リアクションのチェック解除に失敗しました")
    })
  })
})
