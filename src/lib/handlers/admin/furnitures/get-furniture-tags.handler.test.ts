import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnitureTags } from "./get-furniture-tags.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureTag: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getFurnitureTags", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.get("/admin/furniture-tags", getFurnitureTags)
    vi.clearAllMocks()
  })

  it("タグ一覧を取得できる（デフォルトページネーション）", async () => {
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
      {
        _count: { furnitures: 3 },
        createdAt: new Date(),
        id: "tag-1",
        name: "タグ1",
        updatedAt: new Date(),
      },
      {
        _count: { furnitures: 5 },
        createdAt: new Date(),
        id: "tag-2",
        name: "タグ2",
        updatedAt: new Date(),
      },
    ] as never)
    vi.mocked(prisma.furnitureTag.count).mockResolvedValue(2)

    const res = await app.request("/admin/furniture-tags", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグ一覧を取得しました")
    expect(json.data.tags).toHaveLength(2)
    expect(json.data.tags[0].name).toBe("タグ1")
    expect(json.data.tags[0].furnitureCount).toBe(3)
    expect(json.data.pagination).toEqual({
      limit: 20,
      page: 1,
      total: 2,
      totalPages: 1,
    })
  })

  it("ページネーションパラメータを指定できる", async () => {
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
      {
        _count: { furnitures: 1 },
        createdAt: new Date(),
        id: "tag-11",
        name: "タグ11",
        updatedAt: new Date(),
      },
    ] as never)
    vi.mocked(prisma.furnitureTag.count).mockResolvedValue(25)

    const res = await app.request("/admin/furniture-tags?page=2&limit=10", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.pagination).toEqual({
      limit: 10,
      page: 2,
      total: 25,
      totalPages: 3,
    })
    expect(prisma.furnitureTag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
  })

  it("タグが0件の場合は空配列を返す", async () => {
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([])
    vi.mocked(prisma.furnitureTag.count).mockResolvedValue(0)

    const res = await app.request("/admin/furniture-tags", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.data.tags).toHaveLength(0)
    expect(json.data.pagination.total).toBe(0)
    expect(json.data.pagination.totalPages).toBe(0)
  })

  it("タグ名で検索できる", async () => {
    vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
      {
        _count: { furnitures: 2 },
        createdAt: new Date(),
        id: "tag-1",
        name: "フラワーパレード",
        updatedAt: new Date(),
      },
    ] as never)
    vi.mocked(prisma.furnitureTag.count).mockResolvedValue(1)

    const res = await app.request("/admin/furniture-tags?q=フラワー", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.data.tags).toHaveLength(1)
    expect(json.data.tags[0].name).toBe("フラワーパレード")
    expect(prisma.furnitureTag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: "フラワー", mode: "insensitive" } },
      })
    )
    expect(prisma.furnitureTag.count).toHaveBeenCalledWith({
      where: { name: { contains: "フラワー", mode: "insensitive" } },
    })
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureTag.findMany).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-tags", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
