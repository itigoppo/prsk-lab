import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Setting, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getSetting, getSettingRoute } from "./get-setting.handler"

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe("getSetting", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>()
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.openapi(getSettingRoute, getSetting)
    vi.clearAllMocks()
  })

  it("設定が存在する場合は設定情報を返す", async () => {
    const mockSetting = {
      leaderSheetUrl: "https://example.com/sheet.csv",
    } as Setting

    const mockUser = { id: "1" } as unknown as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(mockSetting)

    const res = await app.request("/api/users/settings")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isRegistered).toBe(true)
    expect(json.data.leaderSheetUrl).toBe("https://example.com/sheet.csv")
  })

  it("設定が存在しない場合はisRegistered=falseを返す", async () => {
    const mockUser = { id: "1" } as unknown as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/users/settings")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isRegistered).toBe(false)
    expect(json.data.leaderSheetUrl).toBe(null)
  })

  it("データベースエラーの場合は500を返す", async () => {
    const mockUser = { id: "1" } as unknown as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.findUnique).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/users/settings")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })

  it("ユーザーが存在しない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/users/settings")
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })
})
