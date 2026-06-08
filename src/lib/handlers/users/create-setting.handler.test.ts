import { HTTP_STATUS } from "@/constants/http-status"
import type { AppEnv } from "@/lib/hono/types"
import { prisma } from "@/lib/prisma"
import { validateCsvUrl } from "@/lib/utils/csv-validator"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Setting, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSetting, createSettingRoute } from "./create-setting.handler"

// CSV検証のモック
vi.mock("@/lib/utils/csv-validator", () => ({
  validateCsvUrl: vi.fn(),
}))

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe("createSetting", () => {
  let app: OpenAPIHono<AppEnv>

  beforeEach(() => {
    app = new OpenAPIHono<AppEnv>({
      defaultHook: (result, c) => {
        if (!result.success) {
          return c.json(
            {
              message: "入力内容に誤りがあります",
              success: false,
            },
            HTTP_STATUS.BAD_REQUEST
          )
        }
      },
    })
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.openapi(createSettingRoute, createSetting)
    vi.clearAllMocks()
  })

  it("有効なURLで設定を作成できる", async () => {
    const mockUser = { id: "1" } as User
    const mockValidation = { success: true }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(validateCsvUrl).mockResolvedValue(mockValidation)
    vi.mocked(prisma.setting.create).mockResolvedValue({} as Setting)

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: "https://example.com/sheet.csv" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.message).toBe("設定情報を更新しました")
    expect(prisma.setting.create).toHaveBeenCalledWith({
      data: {
        leaderSheetUrl: "https://example.com/sheet.csv",
        userId: "1",
      },
    })
  })

  it("nullのURLでも設定を作成できる", async () => {
    const mockUser = { id: "1" } as User

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.create).mockResolvedValue({} as Setting)

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(validateCsvUrl).not.toHaveBeenCalled()
  })

  it("無効なURLの場合は400を返す", async () => {
    const mockUser = { id: "1" } as User
    const mockValidation = {
      error: "URLがCSV形式ではありません",
      success: false,
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(validateCsvUrl).mockResolvedValue(mockValidation)

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: "https://example.com/invalid" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toBe("URLがCSV形式ではありません")
  })

  it("バリデーションエラーの場合は400を返す", async () => {
    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: "invalid-url" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toBe("入力内容に誤りがあります")
  })

  it("ユーザーが存在しない場合は401を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json.success).toBe(false)
    expect(json.message).toBe("セッションが無効です")
  })

  it("バリデーションエラー時にメッセージがない場合はデフォルトメッセージを返す", async () => {
    const mockUser = { id: "1" } as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(validateCsvUrl).mockResolvedValue({ success: false }) // errorがundefined

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: "https://example.com/invalid" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toBe("URLの検証に失敗しました")
  })

  it("データベースエラーの場合は500を返す", async () => {
    const mockUser = { id: "1" } as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.create).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })

  it("すでに設定が存在する場合は409を返す", async () => {
    const mockUser = { id: "1", setting: { id: "setting-1" } } as unknown as User
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await app.request("/api/users/settings", {
      body: JSON.stringify({ leaderSheetUrl: null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    expect(json.success).toBe(false)
    expect(json.message).toBe("すでに設定が存在します")
  })
})
