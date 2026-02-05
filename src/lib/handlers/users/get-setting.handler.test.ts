import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getSetting } from "./get-setting.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import type { Setting } from "@prisma/client"

describe("getSetting", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.get("/settings", getSetting)
    vi.clearAllMocks()
  })

  it("設定が存在する場合は設定情報を返す", async () => {
    const mockSetting = {
      leaderSheetUrl: "https://example.com/sheet.csv",
    } as Setting

    vi.mocked(prisma.setting.findFirst).mockResolvedValue(mockSetting)

    const res = await app.request("/settings")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isRegistered).toBe(true)
    expect(json.data.leaderSheetUrl).toBe("https://example.com/sheet.csv")
  })

  it("設定が存在しない場合はisRegistered=falseを返す", async () => {
    vi.mocked(prisma.setting.findFirst).mockResolvedValue(null)

    const res = await app.request("/settings")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isRegistered).toBe(false)
    expect(json.data.leaderSheetUrl).toBe(null)
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.setting.findFirst).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/settings")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
