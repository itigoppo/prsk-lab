import { HTTP_STATUS } from "@/constants/http-status"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnitures, getFurnituresRoute } from "./get-furnitures.handler"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureTag: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"

describe("getFurnitures", () => {
  let app: OpenAPIHono<AppEnv>

  const mockTags = [
    {
      furnitures: [
        { id: "furniture-1", name: "ソファ" },
        { id: "furniture-2", name: "テーブル" },
      ],
      id: "tag-1",
      name: "リビング",
    },
    {
      furnitures: [{ id: "furniture-3", name: "ベッド" }],
      id: "tag-2",
      name: "ベッドルーム",
    },
  ]

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

  it("家具一覧を取得できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ownedFurnitures: [{ furnitureId: "furniture-1" }],
    } as never)
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(mockTags as never)

    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(getFurnituresRoute, getFurnitures)

    const res = await app.request("/api/furnitures")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.tags).toHaveLength(2)
    expect(json.data.tags[0].furnitures[0].owned).toBe(true)
    expect(json.data.tags[0].furnitures[1].owned).toBe(false)
  })

  it("検索クエリで家具名をフィルタできる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ownedFurnitures: [],
    } as never)
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
      {
        furnitures: [{ id: "furniture-1", name: "ソファ" }],
        id: "tag-1",
        name: "リビング",
      },
    ] as never)

    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(getFurnituresRoute, getFurnitures)

    const res = await app.request("/api/furnitures?q=ソファ")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.tags).toHaveLength(1)
    expect(json.data.tags[0].furnitures).toHaveLength(1)
    expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
  })

  it("家具がないタグは除外される", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ownedFurnitures: [],
    } as never)
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
      {
        furnitures: [],
        id: "tag-1",
        name: "空のタグ",
      },
      {
        furnitures: [{ id: "furniture-1", name: "ソファ" }],
        id: "tag-2",
        name: "リビング",
      },
    ] as never)

    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(getFurnituresRoute, getFurnitures)

    const res = await app.request("/api/furnitures")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.tags).toHaveLength(1)
    expect(json.data.tags[0].name).toBe("リビング")
  })

  it("ユーザーが見つからない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(getFurnituresRoute, getFurnitures)

    const res = await app.request("/api/furnitures")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

    app.use("*", async (c, next) => {
      c.set("discordId", "discord-123")
      await next()
    })
    app.openapi(getFurnituresRoute, getFurnitures)

    const res = await app.request("/api/furnitures")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
