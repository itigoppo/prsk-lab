import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateFurnitureGroup } from "./update-furniture-group.handler"

const mockTx = {
  furniture: { updateMany: vi.fn() },
  furnitureGroup: { update: vi.fn() },
  furnitureGroupExcludedCharacter: { create: vi.fn(), deleteMany: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    character: {
      findMany: vi.fn(),
    },
    furniture: {
      findMany: vi.fn(),
    },
    furnitureGroup: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("updateFurnitureGroup", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.patch("/admin/furniture-groups/:groupId", updateFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループ名を更新できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({
        excludedCombinations: [],
        furnitureIds: [],
        name: "更新後のグループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを更新しました")
  })

  it("除外組み合わせを更新できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([{ id: "char-1" }] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({
        excludedCombinations: [["char-1"]],
        furnitureIds: [],
        name: "グループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを更新しました")
  })

  it("除外組み合わせを空にできる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "グループ名" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを更新しました")
  })

  it("グループが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue(null)

    const res = await app.request("/admin/furniture-groups/unknown-group", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新しい名前" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("グループが見つかりません")
  })

  it("グループ名が空の場合は400を返す", async () => {
    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
  })

  it("不明なキャラクターIDの場合は400を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({
        excludedCombinations: [["unknown_code"]],
        furnitureIds: [],
        name: "グループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明なキャラクターID")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新しい名前" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })

  it("家具を指定してグループを更新できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([
      { id: "furniture-1" },
      { id: "furniture-2" },
    ] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({
        excludedCombinations: [],
        furnitureIds: ["furniture-1", "furniture-2"],
        name: "グループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを更新しました")
    expect(mockTx.furniture.updateMany).toHaveBeenCalled()
  })

  it("不明な家具IDの場合は400を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group-1" } as never)
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-groups/group-1", {
      body: JSON.stringify({
        excludedCombinations: [],
        furnitureIds: ["unknown-furniture"],
        name: "グループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明な家具ID")
  })
})
