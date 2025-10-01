import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import {
  CharacterListItem,
  CharacterListResponse,
  CharacterUnitListItem,
} from "@/lib/schemas/character"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getCharacters: Handler = async (c) => {
  try {
    const characters = await prisma.character.findMany({
      orderBy: {
        priority: Prisma.SortOrder.asc,
      },
      select: {
        avatarUrl: true,
        bgColor: true,
        code: true,
        color: true,
        name: true,
        short: true,
        unit: {
          select: {
            bgColor: true,
            code: true,
            color: true,
            name: true,
            short: true,
          },
        },
      },
    })

    const response: CharacterListResponse = {
      data: {
        characters: characters.map((character) => {
          const unit: CharacterUnitListItem | null = character.unit
            ? {
                bgColor: character.unit.bgColor,
                code: character.unit.code,
                color: character.unit.color,
                name: character.unit.name,
                short: character.unit.short,
              }
            : null

          const isVirtualSinger = ["miku", "rin", "len", "luka", "meiko", "kaito"].some((allowed) =>
            character.code.includes(allowed)
          )

          const item: CharacterListItem = {
            avatarUrl: character.avatarUrl,
            bgColor: character.bgColor,
            code: character.code,
            color: character.color,
            isVirtualSinger,
            name: character.name,
            short: character.short,
            unit: unit,
          }

          return item
        }),
      },
      message: "キャラクター情報を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "キャラクター情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
