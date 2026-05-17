import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { reorderFurnitureGroups } from "./reorder-furniture-groups.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    furnitureGroup: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe("reorderFurnitureGroups", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.patch("/admin/furniture-groups/:groupId/reorder", reorderFurnitureGroups)
    vi.clearAllMocks()
  })

  it("上に移動できる（priorityをスワップする）", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      { id: "group-1", priority: 0 },
      { id: "group-2", priority: 1 },
      { id: "group-3", priority: 2 },
    ] as never)

    vi.mocked(prisma.$transaction).mockResolvedValue([])

    const res = await app.request("/admin/furniture-groups/group-2/reorder", {
      body: JSON.stringify({ direction: "up" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(prisma.furnitureGroup.findMany).toHaveBeenCalled()
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it("下に移動できる（priorityをスワップする）", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      { id: "group-1", priority: 0 },
      { id: "group-2", priority: 1 },
      { id: "group-3", priority: 2 },
    ] as never)

    vi.mocked(prisma.$transaction).mockResolvedValue([])

    const res = await app.request("/admin/furniture-groups/group-2/reorder", {
      body: JSON.stringify({ direction: "down" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(prisma.furnitureGroup.findMany).toHaveBeenCalled()
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it("一番上にあるグループをupしようとした場合は何もせず200を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      { id: "group-1", priority: 0 },
      { id: "group-2", priority: 1 },
    ] as never)

    const res = await app.request("/admin/furniture-groups/group-1/reorder", {
      body: JSON.stringify({ direction: "up" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("存在しないグループIDの場合は404を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-groups/group-unknown/reorder", {
      body: JSON.stringify({ direction: "up" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("directionが不正な場合は400を返す", async () => {
    const res = await app.request("/admin/furniture-groups/group-1/reorder", {
      body: JSON.stringify({ direction: "left" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.errors["direction"]).toBeDefined()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
