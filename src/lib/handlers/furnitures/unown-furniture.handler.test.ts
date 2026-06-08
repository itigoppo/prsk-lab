import { HTTP_STATUS } from "@/constants/http-status"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { unownFurniture, unownFurnitureRoute } from "./unown-furniture.handler"

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
      deleteMany: vi.fn(),
    },
  },
}))

import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"

describe("unownFurniture", () => {
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

  it("家具の所持を解除できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)
    vi.mocked(prisma.userFurniture.deleteMany).mockResolvedValue({ count: 1 } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(unownFurnitureRoute, unownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.furnitureId).toBe("furniture1")
    expect(json.data.owned).toBe(false)
  })

  it("ユーザーが見つからない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(unownFurnitureRoute, unownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture1" } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(unownFurnitureRoute, unownFurniture)

    const res = await app.request("/api/furnitures/own/furniture1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
