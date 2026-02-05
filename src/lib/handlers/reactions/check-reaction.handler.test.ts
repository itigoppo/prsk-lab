import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkReaction } from "./check-reaction.handler"

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
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("checkReaction", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    vi.clearAllMocks()
  })

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
