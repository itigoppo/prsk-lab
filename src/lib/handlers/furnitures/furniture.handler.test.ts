import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFurnituresByUnit } from "./get-furnitures-by-unit.handler"
import { getFurnitures } from "./get-furnitures.handler"
import { ownFurniture } from "./own-furniture.handler"
import { unownFurniture } from "./unown-furniture.handler"

type Env = {
  Variables: {
    discordId: string
  }
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
    furniture: {
      findUnique: vi.fn(),
    },
    furnitureGroupExcludedCharacter: {
      findMany: vi.fn(),
    },
    furnitureTag: {
      findMany: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userFurniture: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    userReactionCheck: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("Furniture Handlers", () => {
  let app: Hono<Env>

  beforeEach(() => {
    app = new Hono<Env>()
    vi.clearAllMocks()
    // デフォルトで除外キャラクターは空
    vi.mocked(prisma.furnitureGroupExcludedCharacter.findMany).mockResolvedValue([])
  })

  describe("GET /furnitures/:unitCode (getFurnituresByUnit)", () => {
    const mockUnit = {
      bgColor: "#4455dd",
      characters: [{ id: "char-1" }, { id: "char-2" }],
      code: "leoneed",
      id: "unit-1",
      name: "Leo/need",
    }

    const mockCharacters = [
      { bgColor: "#33aaee", id: "char-1", name: "星乃一歌", short: "一歌" },
      { bgColor: "#4455dd", id: "char-2", name: "初音ミク", short: "ミク" },
    ]

    const mockVsCharacters = [{ bgColor: "#33ccbb", name: "初音ミク" }]

    const mockTags = [
      {
        furnitures: [
          {
            groupId: null,
            id: "furniture-1",
            name: "ソファ",
            reactions: [
              { characters: [{ characterId: "char-1" }], id: "reaction-1" },
              { characters: [{ characterId: "char-2" }], id: "reaction-2" },
            ],
          },
        ],
        id: "tag-1",
        name: "ユニットの部屋",
      },
    ]

    it("ユニットコードで家具一覧を取得できる", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(mockTags as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toBe("家具一覧を取得しました")
      expect(json.data.unitCode).toBe("leoneed")
      expect(json.data.unitName).toBe("Leo/need")
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].name).toBe("ユニットの部屋")
      // ユーザーがいない場合はすべてchecked: false
      expect(json.data.tags[0].furnitures[0].reactions[0].checked).toBe(false)
    })

    it("存在しないユニットコードの場合は404を返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/invalid")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユニットが見つかりません")
    })

    it("ソロリアクションと2人以上のリアクションを分離する", async () => {
      const tagsWithGroupReaction = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-solo" },
                {
                  characters: [{ characterId: "char-1" }, { characterId: "char-2" }],
                  id: "reaction-group",
                },
              ],
            },
          ],
          id: "tag-1",
          name: "ユニットの部屋",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithGroupReaction as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(2)

      // ソロリアクションのタグ
      const soloTag = json.data.tags.find((t: { id: string }) => t.id === "tag-1")
      expect(soloTag.furnitures[0].reactions).toHaveLength(1)
      expect(soloTag.furnitures[0].reactions[0].id).toBe("reaction-solo")

      // グループリアクションのタグ
      const groupTag = json.data.tags.find((t: { id: string }) => t.id === "group-reactions")
      expect(groupTag.name).toBe("2人以上で反応する家具")
      expect(groupTag.furnitures[0].reactions).toHaveLength(1)
      expect(groupTag.furnitures[0].reactions[0].id).toBe("reaction-group")
    })

    it("キャラクターカラーがユニットカラーと同じ場合はVSのカラーを使用する", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(mockTags as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)

      const reactions = json.data.tags[0].furnitures[0].reactions
      // char-1（一歌）: bgColor !== unitColor なのでそのまま
      const ichikaReaction = reactions.find(
        (r: { characters: { id: string }[] }) => r.characters[0].id === "char-1"
      )
      expect(ichikaReaction.characters[0].color).toBe("#33aaee")

      // char-2（ミク）: bgColor === unitColor なのでVSカラーに置き換え
      const mikuReaction = reactions.find(
        (r: { characters: { id: string }[] }) => r.characters[0].id === "char-2"
      )
      expect(mikuReaction.characters[0].color).toBe("#33ccbb")
    })

    it("家具が0件の場合は空のタグ配列を返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([] as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.tags).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockRejectedValue(new Error("Database error"))

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("家具一覧の取得に失敗しました")
    })

    it("ソロリアクションのみの家具はグループリアクションタグに含まれない", async () => {
      const tagsWithSoloOnly = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-1" },
                { characters: [{ characterId: "char-2" }], id: "reaction-2" },
              ],
            },
          ],
          id: "tag-1",
          name: "ユニットの部屋",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithSoloOnly as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      // グループリアクションタグは追加されない
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].id).toBe("tag-1")
    })

    it("家具名で検索できる（SQLレベルでフィルタリング）", async () => {
      // モックはSQLフィルタリング後の結果を返す（実際のDBの動作をシミュレート）
      const tagsFilteredBySql = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
          ],
          id: "tag-1",
          name: "ユニットの部屋",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsFilteredBySql as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?q=ソファ")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
    })

    it("検索クエリが空の場合は全件返す", async () => {
      const tagsWithMultipleFurnitures = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
            {
              groupId: null,
              id: "furniture-2",
              name: "テーブル",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-2" }],
            },
          ],
          id: "tag-1",
          name: "ユニットの部屋",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithMultipleFurnitures as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags[0].furnitures).toHaveLength(2)
    })

    it("検索は大文字小文字を区別しない（SQLのmode: insensitive）", async () => {
      // モックはSQLフィルタリング後の結果を返す（mode: insensitiveで検索された結果）
      const tagsFilteredBySql = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "Simple Table",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
          ],
          id: "tag-1",
          name: "ユニットの部屋",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsFilteredBySql as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?q=simple")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
    })

    it("hideCompleted=trueで全リアクションがチェック済みの家具を除外する", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "完了家具",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
            {
              groupId: null,
              id: "furniture-2",
              name: "未完了家具",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-2" }],
            },
          ],
          id: "tag-1",
          name: "タグ1",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      // reaction-1 のみチェック済み（furniture-1が完了）
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([
        {
          reaction: {
            characters: [{ characterId: "char-1" }],
            furniture: { groupId: null },
          },
          reactionId: "reaction-1",
        },
      ] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?hideCompleted=true")
      const json = await res.json()

      expect(res.status).toBe(200)
      // タグは残るが、完了家具（furniture-1）は除外され、未完了家具のみ残る
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("未完了家具")
    })

    it("hideCompleted=trueで全家具が完了したタグは除外される", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "完了家具",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
          ],
          id: "tag-1",
          name: "完了タグ",
        },
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-2",
              name: "未完了家具",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-2" }],
            },
          ],
          id: "tag-2",
          name: "未完了タグ",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      // reaction-1 のみチェック済み（tag-1の全家具が完了）
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([
        {
          reaction: {
            characters: [{ characterId: "char-1" }],
            furniture: { groupId: null },
          },
          reactionId: "reaction-1",
        },
      ] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?hideCompleted=true")
      const json = await res.json()

      expect(res.status).toBe(200)
      // 完了タグ（tag-1）は家具が0になるので除外
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].name).toBe("未完了タグ")
    })

    it("hideCompleted=falseの場合はフィルタリングしない", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
          ],
          id: "tag-1",
          name: "完了タグ",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?hideCompleted=false")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
    })

    it("リアクションにcheckedフィールドが含まれる", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-1" },
                { characters: [{ characterId: "char-2" }], id: "reaction-2" },
              ],
            },
          ],
          id: "tag-1",
          name: "タグ1",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      // reaction-1 のみチェック済み
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([
        {
          reaction: {
            characters: [{ characterId: "char-1" }],
            furniture: { groupId: null },
          },
          reactionId: "reaction-1",
        },
      ] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      const reactions = json.data.tags[0].furnitures[0].reactions
      // reaction-1 はチェック済み
      const reaction1 = reactions.find((r: { id: string }) => r.id === "reaction-1")
      expect(reaction1.checked).toBe(true)
      // reaction-2 は未チェック
      const reaction2 = reactions.find((r: { id: string }) => r.id === "reaction-2")
      expect(reaction2.checked).toBe(false)
    })

    it("characterIdsで指定したキャラクターを含むリアクションのみ返す", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-1" },
                { characters: [{ characterId: "char-2" }], id: "reaction-2" },
                { characters: [{ characterId: "char-3" }], id: "reaction-3" },
              ],
            },
          ],
          id: "tag-1",
          name: "タグ1",
        },
      ]

      const mockCharactersWithThree = [
        { bgColor: "#33aaee", id: "char-1", name: "星乃一歌", short: "一歌" },
        { bgColor: "#4455dd", id: "char-2", name: "初音ミク", short: "ミク" },
        { bgColor: "#ff6699", id: "char-3", name: "天馬咲希", short: "咲希" },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue({
        ...mockUnit,
        characters: [{ id: "char-1" }, { id: "char-2" }, { id: "char-3" }],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharactersWithThree as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?characterIds=char-1,char-2")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
      // char-1とchar-2のリアクションのみ返る（char-3は除外）
      const reactions = json.data.tags[0].furnitures[0].reactions
      expect(reactions).toHaveLength(2)
      expect(reactions.map((r: { id: string }) => r.id).sort()).toEqual([
        "reaction-1",
        "reaction-2",
      ])
    })

    it("characterIdsが空の場合は全件返す", async () => {
      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(mockTags as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed?characterIds=")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags[0].furnitures[0].reactions).toHaveLength(2)
    })

    it("characterIdsでフィルタ後にリアクションがなくなった家具は除外される", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: null,
              id: "furniture-1",
              name: "ソファ",
              reactions: [{ characters: [{ characterId: "char-1" }], id: "reaction-1" }],
            },
            {
              groupId: null,
              id: "furniture-2",
              name: "テーブル",
              reactions: [{ characters: [{ characterId: "char-2" }], id: "reaction-2" }],
            },
          ],
          id: "tag-1",
          name: "タグ1",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      // char-1のみでフィルタ → furniture-2（char-2のリアクションのみ）は除外される
      const res = await app.request("/furnitures/leoneed?characterIds=char-1")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
    })

    it("同一グループ内の同キャラ組み合わせがチェック済みなら連動してチェック済みになる", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: "group-1",
              id: "furniture-1",
              name: "きらめく流星のソファ",
              reactions: [
                {
                  characters: [{ characterId: "char-1" }, { characterId: "char-2" }],
                  id: "reaction-1",
                },
              ],
            },
            {
              groupId: "group-1",
              id: "furniture-2",
              name: "ナチュラルな2人掛けソファ",
              reactions: [
                {
                  characters: [{ characterId: "char-1" }, { characterId: "char-2" }],
                  id: "reaction-2",
                },
              ],
            },
          ],
          id: "tag-1",
          name: "2人以上で反応する家具",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      // reaction-1 のみ直接チェック済み（同グループのreaction-2も連動してチェック済みになるはず）
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([
        {
          reaction: {
            characters: [{ characterId: "char-1" }, { characterId: "char-2" }],
            furniture: { groupId: "group-1" },
          },
          reactionId: "reaction-1",
        },
      ] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      // 両方のリアクションがチェック済みになる
      const furniture1 = json.data.tags[0].furnitures.find(
        (f: { id: string }) => f.id === "furniture-1"
      )
      const furniture2 = json.data.tags[0].furnitures.find(
        (f: { id: string }) => f.id === "furniture-2"
      )
      expect(furniture1.reactions[0].checked).toBe(true)
      expect(furniture1.reactions[0].checkedByGroup).toBe(false) // 直接チェック
      expect(furniture2.reactions[0].checked).toBe(true)
      expect(furniture2.reactions[0].checkedByGroup).toBe(true) // グループ経由でチェック
    })

    it("除外キャラクターを含むリアクションはグループ共有しない", async () => {
      const tagsWithReactions = [
        {
          furnitures: [
            {
              groupId: "group-1",
              id: "furniture-1",
              name: "コンポーネントオーディオ",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-1" }, // char-1は除外
                { characters: [{ characterId: "char-2" }], id: "reaction-2" }, // char-2は除外されていない
              ],
            },
            {
              groupId: "group-1",
              id: "furniture-2",
              name: "レコードプレイヤー",
              reactions: [
                { characters: [{ characterId: "char-1" }], id: "reaction-3" }, // char-1は除外
                { characters: [{ characterId: "char-2" }], id: "reaction-4" }, // char-2は除外されていない
              ],
            },
          ],
          id: "tag-1",
          name: "ミュージックプレイヤー",
        },
      ]

      vi.mocked(prisma.unit.findUnique).mockResolvedValue(mockUnit as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(tagsWithReactions as never)
      vi.mocked(prisma.character.findMany)
        .mockResolvedValueOnce(mockCharacters as never)
        .mockResolvedValueOnce(mockVsCharacters as never)
      // char-1をgroup-1から除外（ソロ除外: combinationIdが1つ）
      vi.mocked(prisma.furnitureGroupExcludedCharacter.findMany).mockResolvedValue([
        { characterId: "char-1", combinationId: "combo-1", groupId: "group-1" },
      ] as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        ownedFurnitures: [],
      } as never)
      // reaction-1（char-1）とreaction-2（char-2）をチェック済み
      vi.mocked(prisma.userReactionCheck.findMany).mockResolvedValue([
        {
          reaction: {
            characters: [{ characterId: "char-1" }],
            furniture: { groupId: "group-1" },
          },
          reactionId: "reaction-1",
        },
        {
          reaction: {
            characters: [{ characterId: "char-2" }],
            furniture: { groupId: "group-1" },
          },
          reactionId: "reaction-2",
        },
      ] as never)

      app.use("/furnitures/:unitCode", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures/:unitCode", getFurnituresByUnit)

      const res = await app.request("/furnitures/leoneed")
      const json = await res.json()

      expect(res.status).toBe(200)
      const furniture1 = json.data.tags[0].furnitures.find(
        (f: { id: string }) => f.id === "furniture-1"
      )
      const furniture2 = json.data.tags[0].furnitures.find(
        (f: { id: string }) => f.id === "furniture-2"
      )

      // char-1（除外）: furniture-1でチェック済みだが、furniture-2には連動しない
      const f1Char1 = furniture1.reactions.find((r: { id: string }) => r.id === "reaction-1")
      const f2Char1 = furniture2.reactions.find((r: { id: string }) => r.id === "reaction-3")
      expect(f1Char1.checked).toBe(true)
      expect(f1Char1.checkedByGroup).toBe(false) // 直接チェック
      expect(f2Char1.checked).toBe(false) // グループ共有されない

      // char-2（除外されていない）: furniture-1でチェック済み → furniture-2も連動
      const f1Char2 = furniture1.reactions.find((r: { id: string }) => r.id === "reaction-2")
      const f2Char2 = furniture2.reactions.find((r: { id: string }) => r.id === "reaction-4")
      expect(f1Char2.checked).toBe(true)
      expect(f1Char2.checkedByGroup).toBe(false) // 直接チェック
      expect(f2Char2.checked).toBe(true)
      expect(f2Char2.checkedByGroup).toBe(true) // グループ経由でチェック
    })
  })

  describe("GET /furnitures (getFurnitures)", () => {
    const mockTags = [
      {
        furnitures: [
          { id: "furniture-1", name: "ソファ" },
          { id: "furniture-2", name: "テーブル" },
        ],
        id: "tag-1",
        name: "リビング",
      },
      {
        furnitures: [{ id: "furniture-3", name: "ベッド" }],
        id: "tag-2",
        name: "ベッドルーム",
      },
    ]

    it("家具一覧を取得できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ownedFurnitures: [{ furnitureId: "furniture-1" }],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue(mockTags as never)

      app.use("/furnitures", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures", getFurnitures)

      const res = await app.request("/furnitures")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.tags).toHaveLength(2)
      expect(json.data.tags[0].furnitures[0].owned).toBe(true)
      expect(json.data.tags[0].furnitures[1].owned).toBe(false)
    })

    it("検索クエリで家具名をフィルタできる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
        {
          furnitures: [{ id: "furniture-1", name: "ソファ" }],
          id: "tag-1",
          name: "リビング",
        },
      ] as never)

      app.use("/furnitures", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures", getFurnitures)

      const res = await app.request("/furnitures?q=ソファ")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].furnitures).toHaveLength(1)
      expect(json.data.tags[0].furnitures[0].name).toBe("ソファ")
    })

    it("家具がないタグは除外される", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ownedFurnitures: [],
      } as never)
      vi.mocked(prisma.furnitureTag.findMany).mockResolvedValue([
        {
          furnitures: [],
          id: "tag-1",
          name: "空のタグ",
        },
        {
          furnitures: [{ id: "furniture-1", name: "ソファ" }],
          id: "tag-2",
          name: "リビング",
        },
      ] as never)

      app.use("/furnitures", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures", getFurnitures)

      const res = await app.request("/furnitures")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.tags).toHaveLength(1)
      expect(json.data.tags[0].name).toBe("リビング")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.use("/furnitures", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.get("/furnitures", getFurnitures)

      const res = await app.request("/furnitures")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
    })
  })

  describe("POST /furnitures/:furnitureId/own (ownFurniture)", () => {
    it("家具を所持登録できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.furniture.findUnique).mockResolvedValue({ id: "furniture-1" } as never)
      vi.mocked(prisma.userFurniture.upsert).mockResolvedValue({
        furnitureId: "furniture-1",
        userId: "user-1",
      } as never)

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.post("/furnitures/:furnitureId/own", ownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.furnitureId).toBe("furniture-1")
      expect(json.data.owned).toBe(true)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.post("/furnitures/:furnitureId/own", ownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("家具が見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.furniture.findUnique).mockResolvedValue(null)

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.post("/furnitures/:furnitureId/own", ownFurniture)

      const res = await app.request("/furnitures/invalid-id/own", { method: "POST" })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("家具が見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.post("/furnitures/:furnitureId/own", ownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "POST" })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
    })
  })

  describe("DELETE /furnitures/:furnitureId/own (unownFurniture)", () => {
    it("家具の所持を解除できる", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never)
      vi.mocked(prisma.userFurniture.deleteMany).mockResolvedValue({ count: 1 } as never)

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.delete("/furnitures/:furnitureId/own", unownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.furnitureId).toBe("furniture-1")
      expect(json.data.owned).toBe(false)
    })

    it("ユーザーが見つからない場合は404を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.delete("/furnitures/:furnitureId/own", unownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(json.success).toBe(false)
      expect(json.message).toBe("ユーザーが見つかりません")
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"))

      app.use("/furnitures/:furnitureId/own", async (c, next) => {
        c.set("discordId", "discord-123")
        await next()
      })
      app.delete("/furnitures/:furnitureId/own", unownFurniture)

      const res = await app.request("/furnitures/furniture-1/own", { method: "DELETE" })
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
    })
  })
})
