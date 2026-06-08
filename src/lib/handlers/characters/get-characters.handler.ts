import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, jsonResponse } from "@/lib/hono/openapi-helpers"
import { prisma } from "@/lib/prisma"
import {
  CharacterListItem,
  CharacterListResponse,
  CharacterUnitListItem,
  characterListResponseSchema,
} from "@/lib/schemas/response/character.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { Prisma } from "@prisma/client"

export const getCharactersRoute = createRoute({
  description: "全キャラクターの情報をユニット情報と共に取得する",
  method: "get",
  path: "/api/characters",
  responses: {
    ...jsonResponse(HTTP_STATUS.OK, characterListResponseSchema, "キャラクター情報を取得しました"),
    ...commonResponses.internalServerError,
  },
  summary: "キャラクター一覧取得",
  tags: [Tags.CHARACTERS.name],
})

export const getCharacters: RouteHandler<typeof getCharactersRoute> = async (c) => {
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

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "キャラクター情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
