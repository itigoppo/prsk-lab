import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { unownFurniture } from "./unown-furniture.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userFurniture: {
      deleteMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("unownFurniture", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  it("家具の所持を解除できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.userFurniture.deleteMany).mockResolvedValue({ count: 1 } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.delete("/furnitures/:furnitureId/own", unownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.furnitureId).toBe("furniture-1")
    expect(json.data.owned).toBe(false)
  })

  it("ユーザーが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.delete("/furnitures/:furnitureId/own", unownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("ユーザーが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.delete("/furnitures/:furnitureId/own", unownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
