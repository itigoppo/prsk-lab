import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteFurnitureGroup } from "./delete-furniture-group.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureGroup: {
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("deleteFurnitureGroup", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.delete("/admin/furniture-groups/:groupId", deleteFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループを削除できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.furnitureGroup.delete).mockResolvedValue({ id: "group-1" } as never)

    const res = await app.request("/admin/furniture-groups/group-1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを削除しました")
  })

  it("グループが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue(null)

    const res = await app.request("/admin/furniture-groups/unknown-group", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("グループが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.furnitureGroup.delete).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-groups/group-1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
