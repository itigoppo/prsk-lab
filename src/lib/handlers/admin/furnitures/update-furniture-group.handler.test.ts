import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateFurnitureGroup, updateFurnitureGroupRoute } from "./update-furniture-group.handler"

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
    app.openapi(updateFurnitureGroupRoute, updateFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループ名を更新できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/api/admin/furniture-groups/group1", {
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
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([{ id: "char-1" }] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/api/admin/furniture-groups/group1", {
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
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/api/admin/furniture-groups/group1", {
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

    const res = await app.request("/api/admin/furniture-groups/unknowngroup", {
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
    const res = await app.request("/api/admin/furniture-groups/group1", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
  })

  it("不明なキャラクターIDの場合は400を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)

    const res = await app.request("/api/admin/furniture-groups/group1", {
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

  it("除外組み合わせが異なるユニットのキャラクターを含む場合はエラーになる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { id: "char-1", unitId: "unit-1" },
      { id: "char-2", unitId: "unit-2" },
    ] as never)

    const res = await app.request("/api/admin/furniture-groups/group1", {
      body: JSON.stringify({
        excludedCombinations: [["char-1", "char-2"]],
        furnitureIds: [],
        name: "グループ名",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toBe("ユニットをまたいだ組み合わせは作成できません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/admin/furniture-groups/group1", {
      body: JSON.stringify({ excludedCombinations: [], furnitureIds: [], name: "新しい名前" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })

  it("家具を指定してグループを更新できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([
      { id: "furniture-1" },
      { id: "furniture-2" },
    ] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/api/admin/furniture-groups/group1", {
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
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.furniture.findMany).mockResolvedValue([] as never)

    const res = await app.request("/api/admin/furniture-groups/group1", {
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
