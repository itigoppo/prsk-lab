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

describe("PATCH /api/admin/furniture-groups/:groupId/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyNextAuthSession.mockImplementation(async (c, next) => {
      c.set("discordId", MOCK_DISCORD_ID)
      await next()
    })
  })

  it("upを指定すると直上のグループとpriorityをスワップする", async () => {
    await insertMockUser("Admin")

    const group1 = await prisma.furnitureGroup.create({
      data: { id: "group1", name: "G1", priority: 10 },
    })
    const group2 = await prisma.furnitureGroup.create({
      data: { id: "group2", name: "G2", priority: 20 }, // 対象
    })
    const group3 = await prisma.furnitureGroup.create({
      data: { id: "group3", name: "G3", priority: 30 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-groups/${group2.id}/reorder`, {
      body: JSON.stringify({ direction: "up" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)

    const updatedGroup1 = await prisma.furnitureGroup.findUnique({ where: { id: group1.id } })
    const updatedGroup2 = await prisma.furnitureGroup.findUnique({ where: { id: group2.id } })
    const updatedGroup3 = await prisma.furnitureGroup.findUnique({ where: { id: group3.id } })

    expect(updatedGroup1?.priority).toBe(1) // スワップされた
    expect(updatedGroup2?.priority).toBe(0) // スワップされた
    expect(updatedGroup3?.priority).toBe(2) // 影響なし
  })

  it("downを指定すると直下のグループとpriorityをスワップする", async () => {
    await insertMockUser("Editor")

    const group1 = await prisma.furnitureGroup.create({
      data: { id: "group1", name: "G1", priority: 10 },
    })
    const group2 = await prisma.furnitureGroup.create({
      data: { id: "group2", name: "G2", priority: 20 }, // 対象
    })
    const group3 = await prisma.furnitureGroup.create({
      data: { id: "group3", name: "G3", priority: 30 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-groups/${group2.id}/reorder`, {
      body: JSON.stringify({ direction: "down" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)

    const updatedGroup1 = await prisma.furnitureGroup.findUnique({ where: { id: group1.id } })
    const updatedGroup2 = await prisma.furnitureGroup.findUnique({ where: { id: group2.id } })
    const updatedGroup3 = await prisma.furnitureGroup.findUnique({ where: { id: group3.id } })

    expect(updatedGroup1?.priority).toBe(0) // 影響なし
    expect(updatedGroup2?.priority).toBe(2) // スワップされた
    expect(updatedGroup3?.priority).toBe(1) // スワップされた
  })

  it("一番上のグループをupしようとした場合は何もせず200を返す", async () => {
    await insertMockUser("Admin")

    const group = await prisma.furnitureGroup.create({
      data: { id: "grouptop", name: "Top", priority: 0 },
    })

    const res = await openAPIApp.request(`/api/admin/furniture-groups/${group.id}/reorder`, {
      body: JSON.stringify({ direction: "up" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${MOCK_SESSION_TOKEN}`,
      },
      method: "PATCH",
    })

    expect(res.status).toBe(HTTP_STATUS.OK)
    const currentGroup = await prisma.furnitureGroup.findUnique({ where: { id: group.id } })
    expect(currentGroup?.priority).toBe(0) // 変化なし
  })

  it("Viewer権限では403を返す", async () => {
    await insertMockUser("Viewer")

    const res = await openAPIApp.request("/api/admin/furniture-groups/group1/reorder", {
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
