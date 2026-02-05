import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ownFurniture } from "./own-furniture.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

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

import { prisma } from "@/lib/prisma"

describe("ownFurniture", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  it("家具を所持登録できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture-1" } as never)
    vi.mocked(prisma.userFurniture.upsert).mockResolvedValue({
      furnitureId: "furniture-1",
      userId: "user-1",
    } as never)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.post("/furnitures/:furnitureId/own", ownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.furnitureId).toBe("furniture-1")
    expect(json.data.owned).toBe(true)
  })

  it("ユーザーが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.post("/furnitures/:furnitureId/own", ownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("ユーザーが見つかりません")
  })

  it("家具が見つからない場合は404を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(prisma.furniture.findUnique).mockResolvedValue(null)

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.post("/furnitures/:furnitureId/own", ownFurniture)

    const res = await app.request("/furnitures/invalid-id/own", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("家具が見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    app.use("/furnitures/:furnitureId/own", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.post("/furnitures/:furnitureId/own", ownFurniture)

    const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
