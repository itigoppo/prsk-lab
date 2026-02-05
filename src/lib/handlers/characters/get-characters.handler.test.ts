import { HTTP_STATUS } from "@/constants/http-status"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCharacters } from "./get-characters.handler"

type MockCharacter = {
  avatarUrl: string
  bgColor: string
  code: string
  color: string
  name: string
  short: string
  unit: {
    bgColor: string
    code: string
    color: string
    name: string
    short: string
  } | null
}

type CharacterResponse = {
  avatarUrl: string
  bgColor: string
  code: string
  color: string
  isVirtualSinger: boolean
  name: string
  short: string
  unit: {
    bgColor: string
    code: string
    color: string
    name: string
    short: string
  } | null
}

// Prismaのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"

describe("Character Handlers", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  describe("GET /characters (getCharacters)", () => {
    it("キャラクター一覧を取得できる", async () => {
      const mockCharacters: MockCharacter[] = [
        {
          avatarUrl: "https://example.com/miku.png",
          bgColor: "#33ccbb",
          code: "vs_miku",
          color: "#33ccbb",
          name: "初音ミク",
          short: "ミク",
          unit: null,
        },
        {
          avatarUrl: "https://example.com/ichika.png",
          bgColor: "#33aaee",
          code: "ln_ichica",
          color: "#33aaee",
          name: "星乃一歌",
          short: "一歌",
          unit: {
            bgColor: "#4455dd",
            code: "ln",
            color: "#4455dd",
            name: "Leo/need",
            short: "レオニ",
          },
        },
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValue(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toBe("キャラクター情報を取得しました")
      expect(json.data.characters).toHaveLength(2)

      // バーチャルシンガーの判定
      expect(json.data.characters[0].isVirtualSinger).toBe(true)
      expect(json.data.characters[0].code).toBe("vs_miku")
      expect(json.data.characters[0].unit).toBeNull()

      // 通常キャラクターの判定
      expect(json.data.characters[1].isVirtualSinger).toBe(false)
      expect(json.data.characters[1].code).toBe("ln_ichica")
      expect(json.data.characters[1].unit).toEqual({
        bgColor: "#4455dd",
        code: "ln",
        color: "#4455dd",
        name: "Leo/need",
        short: "レオニ",
      })
    })

    it("全てのバーチャルシンガーを正しく判定できる", async () => {
      const virtualSingers: MockCharacter[] = [
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_miku",
          color: "",
          name: "初音ミク",
          short: "ミク",
          unit: null,
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_rin",
          color: "",
          name: "鏡音リン",
          short: "リン",
          unit: null,
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_len",
          color: "",
          name: "鏡音レン",
          short: "レン",
          unit: null,
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_luka",
          color: "",
          name: "巡音ルカ",
          short: "ルカ",
          unit: null,
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_meiko",
          color: "",
          name: "MEIKO",
          short: "メイコ",
          unit: null,
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vs_kaito",
          color: "",
          name: "KAITO",
          short: "カイト",
          unit: null,
        },
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValue(
        virtualSingers as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.characters).toHaveLength(6)

      // 全てがバーチャルシンガーとして判定されることを確認
      json.data.characters.forEach((character: CharacterResponse) => {
        expect(character.isVirtualSinger).toBe(true)
      })
    })

    it("通常キャラクターは全てisVirtualSinger=falseになる", async () => {
      const normalCharacters: MockCharacter[] = [
        {
          avatarUrl: "",
          bgColor: "",
          code: "ln_ichica",
          color: "",
          name: "星乃一歌",
          short: "一歌",
          unit: { bgColor: "", code: "ln", color: "", name: "Leo/need", short: "レオニ" },
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "mmj_minori",
          color: "",
          name: "花里みのり",
          short: "みのり",
          unit: {
            bgColor: "",
            code: "mmj",
            color: "",
            name: "MORE MORE JUMP!",
            short: "モモジャン",
          },
        },
        {
          avatarUrl: "",
          bgColor: "",
          code: "vbs_kohane",
          color: "",
          name: "小豆沢こはね",
          short: "こはね",
          unit: { bgColor: "", code: "vbs", color: "", name: "Vivid BAD SQUAD", short: "ビビバス" },
        },
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValue(
        normalCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.characters).toHaveLength(3)

      // 全てが通常キャラクターとして判定されることを確認
      json.data.characters.forEach((character: CharacterResponse) => {
        expect(character.isVirtualSinger).toBe(false)
        expect(character.unit).not.toBeNull()
      })
    })

    it("キャラクターが0件の場合は空配列を返す", async () => {
      vi.mocked(prisma.character.findMany).mockResolvedValue([])

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.characters).toEqual([])
    })

    it("データベースエラーの場合は500を返す", async () => {
      vi.mocked(prisma.character.findMany).mockRejectedValue(new Error("Database error"))

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(json.success).toBe(false)
      expect(json.message).toBe("キャラクター情報の取得に失敗しました")
    })

    it("unitがnullのキャラクターも正しく処理できる", async () => {
      const mockCharacters: MockCharacter[] = [
        {
          avatarUrl: "https://example.com/special.png",
          bgColor: "#ffffff",
          code: "special_character",
          color: "#ffffff",
          name: "特別キャラ",
          short: "特別",
          unit: null,
        },
      ]

      vi.mocked(prisma.character.findMany).mockResolvedValue(
        mockCharacters as unknown as Awaited<ReturnType<typeof prisma.character.findMany>>
      )

      app.get("/characters", getCharacters)

      const res = await app.request("/characters")
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data.characters[0].unit).toBeNull()
      expect(json.data.characters[0].isVirtualSinger).toBe(false)
    })
  })
})
