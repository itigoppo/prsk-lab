import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  reorderFurnitureGroups,
  reorderFurnitureGroupsRoute,
} from "./reorder-furniture-groups.handler"

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
    app.openapi(reorderFurnitureGroupsRoute, reorderFurnitureGroups)
    vi.clearAllMocks()
  })

  it("上に移動できる（priorityをスワップする）", async () => {
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([
      { id: "group1", priority: 0 },
      { id: "group2", priority: 1 },
      { id: "group3", priority: 2 },
    ] as never)

    vi.mocked(prisma.$transaction).mockResolvedValue([])

    const res = await app.request("/api/admin/furniture-groups/group2/reorder", {
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
      { id: "group1", priority: 0 },
      { id: "group2", priority: 1 },
      { id: "group3", priority: 2 },
    ] as never)

    vi.mocked(prisma.$transaction).mockResolvedValue([])

    const res = await app.request("/api/admin/furniture-groups/group2/reorder", {
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
      { id: "group1", priority: 0 },
      { id: "group2", priority: 1 },
    ] as never)

    const res = await app.request("/api/admin/furniture-groups/group1/reorder", {
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

    const res = await app.request("/api/admin/furniture-groups/groupunknown/reorder", {
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
    const res = await app.request("/api/admin/furniture-groups/group1/reorder", {
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
