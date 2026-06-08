import { HTTP_STATUS } from "@/constants/http-status"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ownFurniture, ownFurnitureRoute } from "./own-furniture.handler"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    furniture: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userFurniture: {
      upsert: vi.fn(),
    },
  },
}))

import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"

describe("ownFurniture", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>({
      defaultHook: (result, c) => {
        if (!result.success)
          return c.json(
            {
              errors: formatZodErrors(result.error),
              message: "入力内容に誤りがあります",
              success: false,
            },
            HTTP_STATUS.BAD_REQUEST
          )
      },
    })
    vi.clearAllMocks()
  })

  it("家具を所持登録できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)
    vi.mocked(prisma.userFurniture.upsert).mockResolvedValue({
      furnitureId: "furniture1",
      userId: "user-1",
    } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.furnitureId).toBe("furniture1")
    expect(json.data.owned).toBe(true)
  })

  it("ユーザーが見つからない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("家具が見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue(null)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/invalidid", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("家具が見つかりません")
  })

  it("既に所持している家具を再登録しても成功する", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)
    vi.mocked(prisma.userFurniture.upsert).mockResolvedValue({
      furnitureId: "furniture1",
      userId: "user-1",
    } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prisma.userFurniture.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {},
        where: { userId_furnitureId: { furnitureId: "furniture1", userId: "user-1" } },
      })
    )
  })

  it("upsertでエラーが発生した場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)
    vi.mocked(prisma.userFurniture.upsert).mockRejectedValue(new Error("Upsert failed"))

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("所持登録に失敗しました")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(ownFurnitureRoute, ownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
