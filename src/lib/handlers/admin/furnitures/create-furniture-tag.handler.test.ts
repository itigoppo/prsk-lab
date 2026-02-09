import { HTTP_STATUS } from "@/constants/http-status"
import { Prisma } from "@prisma/client"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createFurnitureTag } from "./create-furniture-tag.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

const mockTx = {
  furniture: { create: vi.fn() },
  furnitureGroupExcludedCharacter: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
  furnitureReaction: { create: vi.fn() },
  furnitureReactionCharacter: { create: vi.fn() },
  furnitureTag: { create: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    character: {
      findMany: vi.fn(),
    },
    furnitureGroup: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("createFurnitureTag", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    app.post("/admin/furniture-tags", createFurnitureTag)
    vi.clearAllMocks()
  })

  it("タグを作成できる（家具なし）", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({ name: "新タグ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.message).toBe("タグを作成しました")
    expect(json.data.id).toBeDefined()
  })

  it("タグと家具を一括作成できる", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { code: "leoneed_ichika", id: "char-1", priority: 1 },
    ] as never)
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: null,
            name: "家具1",
            reactions: [{ characters: ["char-1"], excludeFromGroup: false }],
          },
        ],
        name: "新タグ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(json.data.id).toBeDefined()
  })

  it("グループから除外するリアクションを含む家具を作成できる", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { code: "leoneed_ichika", id: "char-1", priority: 1 },
      { code: "leoneed_saki", id: "char-2", priority: 2 },
    ] as never)
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([{ id: "group-1" }] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: "group-1",
            name: "家具1",
            reactions: [
              { characters: ["char-1"], excludeFromGroup: false },
              { characters: ["char-1", "char-2"], excludeFromGroup: true },
            ],
          },
        ],
        name: "新タグ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    expect(mockTx.furnitureGroupExcludedCharacter.create).toHaveBeenCalledTimes(2)
  })

  it("グループに既存の除外組み合わせがある場合は重複作成しない", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { code: "leoneed_ichika", id: "char-1", priority: 1 },
      { code: "leoneed_saki", id: "char-2", priority: 2 },
    ] as never)
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([{ id: "group-1" }] as never)
    mockTx.furnitureGroupExcludedCharacter.findMany.mockResolvedValue([
      { characterId: "char-1", combinationId: "comb-existing", groupId: "group-1" },
      { characterId: "char-2", combinationId: "comb-existing", groupId: "group-1" },
    ])
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn(mockTx as never)
    })

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: "group-1",
            name: "家具1",
            reactions: [{ characters: ["char-1", "char-2"], excludeFromGroup: true }],
          },
        ],
        name: "新タグ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CREATED)
    expect(json.success).toBe(true)
    // 既存と同じ組み合わせなので作成されない
    expect(mockTx.furnitureGroupExcludedCharacter.create).not.toHaveBeenCalled()
  })

  it("タグ名が空の場合は400を返す", async () => {
    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
  })

  it("不明なキャラクターIDの場合は400を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: null,
            name: "家具1",
            reactions: [{ characters: ["unknown_code"], excludeFromGroup: false }],
          },
        ],
        name: "新タグ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明なキャラクターID")
  })

  it("不明なグループIDの場合は400を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { code: "leoneed_ichika", id: "char-1", priority: 1 },
    ] as never)
    vi.mocked(prisma.furnitureGroup.findMany).mockResolvedValue([] as never)

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({
        furnitures: [
          {
            groupId: "unknown-group",
            name: "家具1",
            reactions: [{ characters: ["char-1"], excludeFromGroup: false }],
          },
        ],
        name: "新タグ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(json.success).toBe(false)
    expect(json.message).toContain("不明なグループID")
  })

  it("同名のタグが存在する場合は409を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "5.0.0",
        code: "P2002",
      })
    )

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({ name: "既存タグ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    expect(json.success).toBe(false)
    expect(json.message).toBe("同じ名前のタグが既に存在します")
  })

  it("データベースエラーの場合は500を返す", async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("Database error"))

    const res = await app.request("/admin/furniture-tags", {
      body: JSON.stringify({ name: "新タグ" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const json = await res.json()

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(json.success).toBe(false)
  })
})
