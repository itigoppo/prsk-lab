import { HTTP_STATUS } from "@/constants/http-status"
import { openAPIApp } from "@/lib/hono/openapi"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"
import type { Context, Next } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockUser } from "../../../mocks/factories"

const MOCK_DISCORD_ID = "discord-123456"
const MOCK_SESSION_TOKEN = "mock_session_token"

// NextAuth セッション検証ミドルウェアをモック
const mockVerifyNextAuthSession = vi.fn()
vi.mock("@/lib/middleware/verify-nextauth-session", () => ({
  verifyNextAuthSession: (c: Context, next: Next) => mockVerifyNextAuthSession(c, next),
}))

const insertMockUser = async (role: UserRole = "Admin") => {
  const data = createMockUser({ discordId: MOCK_DISCORD_ID, role })
  return await prisma.user.create({ data })
}

describe("PATCH /api/admin/furniture-tags/:tagId/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  it("upを指定すると直上のタグとpriorityをスワップする", async () => {
    await insertMockUser("Admin")

    const tag1 = await prisma.furnitureTag.create({
      data: { id: "tag1", name: "T1", priority: 10 },
    })
    const tag2 = await prisma.furnitureTag.create({
      data: { id: "tag2", name: "T2", priority: 20 }, // 対象
    })
    const tag3 = await prisma.furnitureTag.create({
      data: { id: "tag3", name: "T3", priority: 30 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-tags/${tag2.id}/reorder`, {
      body: JSON.stringify({ direction: "up" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)

    const updatedTag1 = await prisma.furnitureTag.findUnique({ where: { id: tag1.id } })
    const updatedTag2 = await prisma.furnitureTag.findUnique({ where: { id: tag2.id } })
    const updatedTag3 = await prisma.furnitureTag.findUnique({ where: { id: tag3.id } })

    expect(updatedTag1?.priority).toBe(1) // スワップされた
    expect(updatedTag2?.priority).toBe(0) // スワップされた
    expect(updatedTag3?.priority).toBe(2) // 影響なし
  })

  it("downを指定すると直下のタグとpriorityをスワップする", async () => {
    await insertMockUser("Editor")

    const tag1 = await prisma.furnitureTag.create({
      data: { id: "tag1", name: "T1", priority: 10 },
    })
    const tag2 = await prisma.furnitureTag.create({
      data: { id: "tag2", name: "T2", priority: 20 }, // 対象
    })
    const tag3 = await prisma.furnitureTag.create({
      data: { id: "tag3", name: "T3", priority: 30 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-tags/${tag2.id}/reorder`, {
      body: JSON.stringify({ direction: "down" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)

    const updatedTag1 = await prisma.furnitureTag.findUnique({ where: { id: tag1.id } })
    const updatedTag2 = await prisma.furnitureTag.findUnique({ where: { id: tag2.id } })
    const updatedTag3 = await prisma.furnitureTag.findUnique({ where: { id: tag3.id } })

    expect(updatedTag1?.priority).toBe(0) // 影響なし
    expect(updatedTag2?.priority).toBe(2) // スワップされた
    expect(updatedTag3?.priority).toBe(1) // スワップされた
  })

  it("一番上のタグをupしようとした場合は何もせず200を返す", async () => {
    await insertMockUser("Admin")

    const tag = await prisma.furnitureTag.create({
      data: { id: "tagtop", name: "Top", priority: 0 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-tags/${tag.id}/reorder`, {
      body: JSON.stringify({ direction: "up" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)
    const currentTag = await prisma.furnitureTag.findUnique({ where: { id: tag.id } })
    expect(currentTag?.priority).toBe(0) // 変化なし
  })

  it("Viewer権限では403を返す", async () => {
    await insertMockUser("Viewer")

    const res = await openAPIApp.request("/api/admin/furniture-tags/tag1/reorder", {
      body: JSON.stringify({ direction: "up" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
  })
})
