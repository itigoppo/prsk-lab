import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { formatZodErrors } from "@/lib/utils/zod"
import { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteFurnitureTag, deleteFurnitureTagRoute } from "./delete-furniture-tag.handler"

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
    app.openapi(deleteFurnitureTagRoute, deleteFurnitureTag)
    vi.clearAllMocks()
  })

  it("タグを削除できる", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
      id: "tag1",
    } as never)
    vi.mocked(prisma.furnitureTag.delete).mockResolvedValue({
      id: "tag1",
    } as never)

    const res = await app.request("/api/admin/furniture-tags/tag1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグを削除しました")
  })

  it("タグが見つからない場合は404を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/admin/furniture-tags/unknowntag", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(json.success).toBe(false)
    expect(json.message).toBe("タグが見つかりません")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.furnitureTag.findUnique).mockResolvedValue({
      id: "tag1",
    } as never)
    vi.mocked(prisma.furnitureTag.delete).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/admin/furniture-tags/tag1", { method: "DELETE" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
