import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { requireAdmin, requireEditorOrAdmin, requireRole } from "./require-role"

type Env = {
  Variables: {
    discordId: string
    userRole: string
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("requireRole middleware", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
  })

  describe("requireRole", () => {
    it("許可されたロールのユーザーはアクセスできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Editor" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(200)
    })

    it("Adminロールのユーザーはアクセスできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Admin" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(200)
    })

    it("許可されていないロールのユーザーは403を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Viewer" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      expect(json.success).toBe(false)
      expect(json.message).toBe("この操作を行う権限がありません")
    })

    it("discordIdがない場合は401を返す", async () => {
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(json.success).toBe(false)
      expect(json.message).toBe("認証が必要です")
    })

    it("ユーザーが存在しない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Editor", "Admin"]))
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("認証処理中にエラーが発生しました")
    })

    it("userRoleがコンテキストにセットされる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Admin" } as never)

      let capturedRole: string | undefined
      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireRole(["Admin"]))
      app.get("/test", (c) => {
        capturedRole = c.get("userRole")
        return c.json({ success: true })
      })

      await app.request("/test")

      expect(capturedRole).toBe("Admin")
    })
  })

  describe("requireEditorOrAdmin", () => {
    it("Editorロールのユーザーはアクセスできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Editor" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireEditorOrAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(200)
    })

    it("Adminロールのユーザーはアクセスできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Admin" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireEditorOrAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(200)
    })

    it("Viewerロールのユーザーは403を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Viewer" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireEditorOrAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })

  describe("requireAdmin", () => {
    it("Adminロールのユーザーはアクセスできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Admin" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(200)
    })

    it("Editorロールのユーザーは403を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Editor" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it("Viewerロールのユーザーは403を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "Viewer" } as never)

      app.use("*", (c, next) => {
        c.set("discordId", "discord-123")
        return next()
      })
      app.use("*", requireAdmin)
      app.get("/test", (c) => c.json({ success: true }))

      const res = await app.request("/test")

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })
})
