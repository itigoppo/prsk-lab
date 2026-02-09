import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnitureGroups } from "./get-furniture-groups.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureGroup: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getFurnitureGroups", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.get("/admin/furniture-groups", getFurnitureGroups)
    vi.clearAllMocks()
  })

  it("グループ一覧を取得できる（デフォルトページネーション）", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      {
        _count: { furnitures: 3 },
        createdAt: new Date(),
        excludedCharacters: [{ combinationId: "comb-1" }, { combinationId: "comb-1" }],
        id: "group-1",
        name: "グループ1",
        updatedAt: new Date(),
      },
      {
        _count: { furnitures: 5 },
        createdAt: new Date(),
        excludedCharacters: [
          { combinationId: "comb-1" },
          { combinationId: "comb-2" },
          { combinationId: "comb-2" },
        ],
        id: "group-2",
        name: "グループ2",
        updatedAt: new Date(),
      },
    ] as never)
    vi.mocked(prisma.furnitureGroup.count).mockResolvedValue(2)

    const res = await app.request("/admin/furniture-groups", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループ一覧を取得しました")
    expect(json.data.groups).toHaveLength(2)
    expect(json.data.groups[0].name).toBe("グループ1")
    expect(json.data.groups[0].furnitureCount).toBe(3)
    expect(json.data.groups[0].excludedCombinationCount).toBe(1)
    expect(json.data.groups[1].excludedCombinationCount).toBe(2)
    expect(json.data.pagination).toEqual({
      limit: 20,
      page: 1,
      total: 2,
      totalPages: 1,
    })
  })

  it("ページネーションパラメータを指定できる", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      {
        _count: { furnitures: 1 },
        createdAt: new Date(),
        excludedCharacters: [],
        id: "group-11",
        name: "グループ11",
        updatedAt: new Date(),
      },
    ] as never)
    vi.mocked(prisma.furnitureGroup.count).mockResolvedValue(25)

    const res = await app.request("/admin/furniture-groups?page=2&limit=10", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.pagination).toEqual({
      limit: 10,
      page: 2,
      total: 25,
      totalPages: 3,
    })
    expect(prisma.furnitureGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
  })

  it("グループが0件の場合は空配列を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([])
    vi.mocked(prisma.furnitureGroup.count).mockResolvedValue(0)

    const res = await app.request("/admin/furniture-groups", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.data.groups).toHaveLength(0)
    expect(json.data.pagination.total).toBe(0)
    expect(json.data.pagination.totalPages).toBe(0)
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-groups", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
