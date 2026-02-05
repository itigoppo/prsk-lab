import { HTTP_STATUS } from "@/constants/http-status"
import { Prisma } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

type MockUnit = {
  bgColor: string
  code: string
  color: string
  name: string
  short: string
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import { getUnits } from "./get-units.handler"

describe("Unit Handlers", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  describe("GET /units (getUnits)", () => {
    it("ユニット一覧を取得できる", async () => {
      const mockUnits: MockUnit[] = [
        {
          bgColor: "#4455dd",
          code: "ln",
          color: "#4455dd",
          name: "Leo/need",
          short: "レオニ",
        },
      ]

      vi.mocked(prisma.unit.findMany).mockResolvedValue(
        mockUnits as unknown as Awaited<ReturnType<typeof prisma.unit.findMany>>
      )

      app.get("/units", getUnits)

      const res = await app.request("/units")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toBe("ユニット情報を取得しました")
      expect(json.data.units).toHaveLength(1)

      expect(json.data.units[0].code).toBe("ln")
      expect(json.data.units[0].name).toBe("Leo/need")
      expect(json.data.units[0].short).toBe("レオニ")
      expect(json.data.units[0].color).toBe("#4455dd")
      expect(json.data.units[0].bgColor).toBe("#4455dd")
    })

    it("複数ユニットがpriority順で返される", async () => {
      const mockUnits: MockUnit[] = [
        {
          bgColor: "#4455dd",
          code: "ln",
          color: "#4455dd",
          name: "Leo/need",
          short: "レオニ",
        },
        {
          bgColor: "#6495ed",
          code: "mmj",
          color: "#6495ed",
          name: "MORE MORE JUMP!",
          short: "モモジャン",
        },
        {
          bgColor: "#ee7722",
          code: "vbs",
          color: "#ee7722",
          name: "Vivid BAD SQUAD",
          short: "ビビバス",
        },
      ]

      vi.mocked(prisma.unit.findMany).mockResolvedValue(
        mockUnits as unknown as Awaited<ReturnType<typeof prisma.unit.findMany>>
      )

      app.get("/units", getUnits)

      const res = await app.request("/units")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.units).toHaveLength(3)
      expect(json.data.units[0].code).toBe("ln")
      expect(json.data.units[1].code).toBe("mmj")
      expect(json.data.units[2].code).toBe("vbs")

      // priority順でソートされるようにfindManyが呼ばれていることを確認
      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: Prisma.SortOrder.asc },
        })
      )
    })

    it("ユニットが0件の場合は空配列を返す", async () => {
      vi.mocked(prisma.unit.findMany).mockResolvedValue([])

      app.get("/units", getUnits)

      const res = await app.request("/units")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.units).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.unit.findMany).mockRejectedValue(new Error("Database error"))

      app.get("/units", getUnits)

      const res = await app.request("/units")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユニット情報の取得に失敗しました")
    })
  })
})
