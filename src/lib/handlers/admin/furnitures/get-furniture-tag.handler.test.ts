import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnitureTag } from "./get-furniture-tag.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureGroupExcludedCharacter: {
      findMany: vi.fn(),
    },
    furnitureTag: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getFurnitureTag", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.get("/admin/furniture-tags/:tagId", getFurnitureTag)
    vi.clearAllMocks()
  })

  it("タグ詳細を取得できる", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
      createdAt: new Date("2024-01-01"),
      furnitures: [
        {
          group: { name: "グループ1" },
          groupId: "group-1",
          id: "furniture-1",
          name: "家具1",
          reactions: [
            {
              characters: [
                {
                  character: { bgColor: "#FF6699", color: "#FFFFFF", id: "char-1", short: "一歌" },
                  createdAt: new Date(),
                },
              ],
              createdAt: new Date(),
              id: "reaction-1",
            },
          ],
        },
      ],
      id: "tag-1",
      name: "タグ1",
      updatedAt: new Date("2024-01-02"),
    } as never)
    vi.mocked(prisma.furnitureGroupExcludedCharacter.findMany).mockResolvedValue([])

    const res = await app.request("/admin/furniture-tags/tag-1", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグを取得しました")
    expect(json.data.tag.id).toBe("tag-1")
    expect(json.data.tag.name).toBe("タグ1")
    expect(json.data.tag.furnitures).toHaveLength(1)
    expect(json.data.tag.furnitures[0].reactions).toHaveLength(1)
    expect(json.data.tag.furnitures[0].reactions[0].characters[0].short).toBe("一歌")
  })

  it("タグが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue(null)

    const res = await app.request("/admin/furniture-tags/unknown-tag", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("タグが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-tags/tag-1", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
