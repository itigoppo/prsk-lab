import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnitureGroup, getFurnitureGroupRoute } from "./get-furniture-group.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    furnitureGroup: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getFurnitureGroup", () => {
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
    app.openapi(getFurnitureGroupRoute, getFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループ詳細を取得できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({
      excludedCharacters: [
        {
          character: { bgColor: "#AAA", color: "#FFF", id: "char-1", short: "一歌" },
          characterId: "char-1",
          combinationId: "combo-1",
        },
        {
          character: { bgColor: "#BBB", color: "#000", id: "char-2", short: "咲希" },
          characterId: "char-2",
          combinationId: "combo-1",
        },
      ],
      furnitures: [{ id: "furniture-1", name: "家具1", tag: { name: "タグ1" }, tagId: "tag1" }],
      id: "group1",
      name: "グループ1",
    } as never)

    const res = await app.request("/api/admin/furniture-groups/group1", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを取得しました")
    expect(json.data.group.id).toBe("group1")
    expect(json.data.group.name).toBe("グループ1")
    expect(json.data.group.furnitures).toHaveLength(1)
    expect(json.data.group.furnitures[0].name).toBe("家具1")
    expect(json.data.group.excludedCombinations).toHaveLength(1)
    expect(json.data.group.excludedCombinations[0].combinationId).toBe("combo-1")
    expect(json.data.group.excludedCombinations[0].characters).toHaveLength(2)
  })

  it("除外組み合わせがない場合も正常に取得できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({
      excludedCharacters: [],
      furnitures: [],
      id: "group1",
      name: "グループ1",
    } as never)

    const res = await app.request("/api/admin/furniture-groups/group1", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.data.group.excludedCombinations).toHaveLength(0)
    expect(json.data.group.furnitures).toHaveLength(0)
  })

  it("グループが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/admin/furniture-groups/unknowngroup", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("グループが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/admin/furniture-groups/group1", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
