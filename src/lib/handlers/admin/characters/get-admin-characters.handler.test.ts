import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAdminCharacters } from "./get-admin-characters.handler"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("getAdminCharacters", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.get("/admin/furniture-characters", getAdminCharacters)
    vi.clearAllMocks()
  })

  it("キャラクター一覧を取得できる", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      {
        avatarUrl: "https://example.com/ichika.png",
        bgColor: "#33AAEE",
        code: "leoneed_ichika",
        color: "#33AAEE",
        id: "char-1",
        name: "星乃一歌",
        short: "一歌",
        unit: {
          bgColor: "#4455DD",
          code: "leoneed",
          color: "#4455DD",
          name: "Leo/need",
          short: "レオニ",
        },
      },
      {
        avatarUrl: null,
        bgColor: "#33CCBB",
        code: "mmj_minori",
        color: "#33CCBB",
        id: "char-2",
        name: "花里みのり",
        short: "みのり",
        unit: {
          bgColor: "#88DD44",
          code: "mmj",
          color: "#88DD44",
          name: "MORE MORE JUMP!",
          short: "モモジャン",
        },
      },
    ] as never)

    const res = await app.request("/admin/furniture-characters", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.message).toBe("キャラクター情報を取得しました")
    expect(json.data.characters).toHaveLength(2)
    expect(json.data.characters[0].code).toBe("leoneed_ichika")
    expect(json.data.characters[0].unit).not.toBeNull()
    expect(json.data.characters[0].unit.code).toBe("leoneed")
  })

  it("ユニットがnullのキャラクターも返せる", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      {
        avatarUrl: null,
        bgColor: "#FF0000",
        code: "test_char",
        color: "#FF0000",
        id: "char-1",
        name: "テストキャラ",
        short: "テスト",
        unit: null,
      },
    ] as never)

    const res = await app.request("/admin/furniture-characters", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.data.characters[0].unit).toBeNull()
  })

  it("キャラクターが0件の場合は空配列を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([])

    const res = await app.request("/admin/furniture-characters", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(json.success).toBe(true)
    expect(json.data.characters).toEqual([])
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.character.findMany).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-characters", { method: "GET" })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
    expect(json.message).toBe("キャラクター情報の取得に失敗しました")
  })
})
