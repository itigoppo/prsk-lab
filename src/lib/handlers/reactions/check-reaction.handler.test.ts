import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkReaction, checkReactionRoute } from "./check-reaction.handler"

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

describe("checkReaction", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>()
    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    vi.clearAllMocks()
  })

  it("リアクションをチェックできる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.upsert).mockResolvedValue({
      id: "check-1",
      reactionId: "tz4a98xxat96iwsdz6os",
      userId: "user-1",
    } as never)

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("リアクションをチェックしました")
    expect(json.data.reactionId).toBe("tz4a98xxat96iwsdz6os")
    expect(json.data.checked).toBe(true)
  })

  it("ユーザーが見つからない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("リアクションが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue(null)

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションが見つかりません")
  })

  it("既にチェック済みのリアクションを再チェックしても成功する", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.upsert).mockResolvedValue({
      id: "check-1",
      reactionId: "tz4a98xxat96iwsdz6os",
      userId: "user-1",
    } as never)

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(prisma.userReactionCheck.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {},
        where: { userId_reactionId: { reactionId: "tz4a98xxat96iwsdz6os", userId: "user-1" } },
      })
    )
  })

  it("upsertでエラーが発生した場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.upsert).mockRejectedValue(new Error("Upsert failed"))

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションのチェックに失敗しました")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    app.openapi(checkReactionRoute, checkReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションのチェックに失敗しました")
  })
})
