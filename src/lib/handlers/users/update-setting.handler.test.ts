import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateSetting } from "./update-setting.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

// CSV検証のモック
vi.mock("@/lib/utils/csv-validator", () => ({
  validateCsvUrl: vi.fn(),
}))

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      update: vi.fn(),
    },
    user: {
      findFirstOrThrow: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import { validateCsvUrl } from "@/lib/utils/csv-validator"
import type { Setting, User } from "@prisma/client"

describe("updateSetting", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    // 認証済み前提: discordIdが常にセットされている状態でテスト
    app.use("*", async (c, next) => {
      c.set("discordId", "123456789")
      await next()
    })
    app.patch("/settings", updateSetting)
    vi.clearAllMocks()
  })

  it("有効なURLで設定を更新できる", async () => {
    const mockUser = { id: "1" } as User
    const mockValidation = { success: true }

    vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)
    vi.mocked(validateCsvUrl).mockResolvedValue(mockValidation)
    vi.mocked(prisma.setting.update).mockResolvedValue({} as Setting)

    const res = await app.request("/settings", {
      body: JSON.stringify({ leaderSheetUrl: "https://example.com/updated.csv" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toBe("設定情報を更新しました")
    expect(prisma.setting.update).toHaveBeenCalledWith({
      data: {
        leaderSheetUrl: "https://example.com/updated.csv",
      },
      where: { userId: "1" },
    })
  })

  it("nullにクリアできる", async () => {
    const mockUser = { id: "1" } as User

    vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)
    vi.mocked(prisma.setting.update).mockResolvedValue({} as Setting)

    const res = await app.request("/settings", {
      body: JSON.stringify({ leaderSheetUrl: null }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(validateCsvUrl).not.toHaveBeenCalled()
    expect(prisma.setting.update).toHaveBeenCalledWith({
      data: {
        leaderSheetUrl: null,
      },
      where: { userId: "1" },
    })
  })

  it("無効なURLの場合は400を返す", async () => {
    const mockUser = { id: "1" } as User
    const mockValidation = {
      error: "CSVのカラム数が正しくありません",
      success: false,
    }

    vi.mocked(prisma.user.findFirstOrThrow).mockResolvedValue(mockUser)
    vi.mocked(validateCsvUrl).mockResolvedValue(mockValidation)

    const res = await app.request("/settings", {
      body: JSON.stringify({ leaderSheetUrl: "https://example.com/invalid.csv" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toBe("CSVのカラム数が正しくありません")
  })
})
