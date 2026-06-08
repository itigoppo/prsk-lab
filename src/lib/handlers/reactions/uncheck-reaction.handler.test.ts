import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { uncheckReaction, uncheckReactionRoute } from "./uncheck-reaction.handler"

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
    },
  },
}))

describe("uncheckReaction", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>()
    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    vi.clearAllMocks()
  })

  it("リアクションのチェックを解除できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValue({ count: 1 } as never)

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("リアクションのチェックを解除しました")
    expect(json.data.reactionId).toBe("tz4a98xxat96iwsdz6os")
    expect(json.data.checked).toBe(false)
  })

  it("チェックが存在しなくても成功を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.deleteMany).mockResolvedValue({ count: 0 } as never)

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
  })

  it("ユーザーが見つからない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("リアクションが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue(null)

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションが見つかりません")
  })

  it("deleteManyでエラーが発生した場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)
    vi.mocked(prisma.userReactionCheck.deleteMany).mockRejectedValue(new Error("Database error"))

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションのチェック解除に失敗しました")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))
    vi.mocked(prisma.furnitureReaction.findUnique).mockResolvedValue({
      id: "tz4a98xxat96iwsdz6os",
    } as never)

    app.openapi(uncheckReactionRoute, uncheckReaction)

    const res = await app.request("/api/reactions/tz4a98xxat96iwsdz6os/check", {
      method: "DELETE",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("リアクションのチェック解除に失敗しました")
  })
})
