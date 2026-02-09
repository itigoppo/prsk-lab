import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteFurnitureTag } from "./delete-furniture-tag.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureTag: {
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("deleteFurnitureTag", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.delete("/admin/furniture-tags/:tagId", deleteFurnitureTag)
    vi.clearAllMocks()
  })

  it("タグを削除できる", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
      id: "tag-1",
    } as never)
    vi.mocked(prisma.furnitureTag.delete).mockResolvedValue({
      id: "tag-1",
    } as never)

    const res = await app.request("/admin/furniture-tags/tag-1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグを削除しました")
  })

  it("タグが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue(null)

    const res = await app.request("/admin/furniture-tags/unknown-tag", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("タグが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
      id: "tag-1",
    } as never)
    vi.mocked(prisma.furnitureTag.delete).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-tags/tag-1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
