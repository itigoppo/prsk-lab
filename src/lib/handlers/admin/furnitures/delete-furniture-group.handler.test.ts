import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteFurnitureGroup, deleteFurnitureGroupRoute } from "./delete-furniture-group.handler"

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
    app.openapi(deleteFurnitureGroupRoute, deleteFurnitureGroup)
    vi.clearAllMocks()
  })

  it("グループを削除できる", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.furnitureGroup.delete).mockResolvedValue({ id: "group1" } as never)

    const res = await app.request("/api/admin/furniture-groups/group1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("グループを削除しました")
  })

  it("グループが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/admin/furniture-groups/unknowngroup", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("グループが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureGroup.findUnique).mockResolvedValue({ id: "group1" } as never)
    vi.mocked(prisma.furnitureGroup.delete).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/admin/furniture-groups/group1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
