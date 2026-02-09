import { HTTP_STATUS } from "@/constants/http-status"
import { Prisma } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateFurnitureTag } from "./update-furniture-tag.handler"

const mockTx = {
  furniture: { create: vi.fn(), deleteMany: vi.fn() },
  furnitureGroupExcludedCharacter: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
  furnitureReaction: { create: vi.fn() },
  furnitureReactionCharacter: { create: vi.fn() },
  furnitureTag: { update: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    character: {
      findMany: vi.fn(),
    },
    furnitureGroup: {
      findMany: vi.fn(),
    },
    furnitureTag: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("updateFurnitureTag", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.patch("/admin/furniture-tags/:tagId", updateFurnitureTag)
    vi.clearAllMocks()
  })

  it("タグ名を更新できる", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags/tag-1", {
      body: JSON.stringify({ name: "更新後のタグ名" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグを更新しました")
  })

  it("タグと家具を一括更新できる", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { code: "leoneed_ichika", id: "char-1", priority: 1 },
    ] as never)
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags/tag-1", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: null,
            name: "家具1",
            reactions: [{ characters: ["char-1"], excludeFromGroup: false }],
          },
        ],
        name: "更新後のタグ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(mockTx.furniture.deleteMany).toHaveBeenCalledWith({ where: { tagId: "tag-1" } })
    expect(mockTx.furniture.create).toHaveBeenCalled()
  })

  it("タグが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue(null)

    const res = await app.request("/admin/furniture-tags/unknown-tag", {
      body: JSON.stringify({ name: "新しい名前" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("タグが見つかりません")
  })

  it("タグ名が空の場合は400を返す", async () => {
    const res = await app.request("/admin/furniture-tags/tag-1", {
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
  })

  it("同名のタグが存在する場合は409を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "5.0.0",
        code: "P2002",
      })
    )

    const res = await app.request("/admin/furniture-tags/tag-1", {
      body: JSON.stringify({ name: "既存タグ" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    expect(json.success).toBe(false)
    expect(json.message).toBe("同じ名前のタグが既に存在します")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({ id: "tag-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-tags/tag-1", {
      body: JSON.stringify({ name: "新しい名前" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
