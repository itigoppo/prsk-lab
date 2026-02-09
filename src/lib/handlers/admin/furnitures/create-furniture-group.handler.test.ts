import { HTTP_STATUS } from "@/constants/http-status"
import { Prisma } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createFurnitureGroup } from "./create-furniture-group.handler"

const mockTx = {
  furniture: { updateMany: vi.fn() },
  furnitureGroup: { create: vi.fn() },
  furnitureGroupExcludedCharacter: { create: vi.fn() },
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
  },
}))

import { prisma } from "@/lib/prisma"

describe("createFurnitureGroup", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.post("/admin/furniture-groups", createFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループを作成できる（除外なし）", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新グループ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを作成しました")
    expect(json.data.id).toBeDefined()
  })

  it("除外組み合わせ付きでグループを作成できる", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { id: "char-1" },
      { id: "char-2" },
    ] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({
        excludedCombinations: [["char-1", "char-2"]],
        furnitureIds: [],
        name: "新グループ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.data.id).toBeDefined()
  })

  it("家具を指定してグループを作成できる", async () => {
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([
      { id: "furniture-1" },
      { id: "furniture-2" },
    ] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({
        excludedCombinations: [],
        furnitureIds: ["furniture-1", "furniture-2"],
        name: "新グループ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.data.id).toBeDefined()
    expect(mockTx.furniture.updateMany).toHaveBeenCalled()
  })

  it("不明な家具IDの場合は400を返す", async () => {
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({
        excludedCombinations: [],
        furnitureIds: ["unknown-furniture"],
        name: "新グループ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明な家具ID")
  })

  it("グループ名が空の場合は400を返す", async () => {
    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
  })

  it("不明なキャラクターIDの場合は400を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({
        excludedCombinations: [["unknown_code"]],
        furnitureIds: [],
        name: "新グループ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明なキャラクターID")
  })

  it("同名のグループが存在する場合は409を返す", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "5.0.0",
        code: "P2002",
      })
    )

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "既存グループ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    expect(json.success).toBe(false)
    expect(json.message).toBe("同じ名前のグループが既に存在します")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-groups", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新グループ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
