import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { AdminCharacterListResponse } from "@/lib/schemas/response/admin/character.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

// ユニットごとに許可するバーチャルシンガー
const allowedVsPerUnit: Record<string, string[]> = {
  leoneed: ["miku", "luka"],
  mmj: ["miku", "rin"],
  oclock: ["miku"],
  vbs: ["miku", "len", "meiko"],
  ws: ["miku", "kaito"],
}

// 除外するキャラクターコードを生成
const allVs = ["miku", "rin", "len", "luka", "meiko", "kaito"]
const excludedCodes: string[] = []
for (const [unit, allowed] of Object.entries(allowedVsPerUnit)) {
  for (const vs of allVs) {
    if (!allowed.includes(vs)) {
      excludedCodes.push(`${unit}_${vs}`)
    }
  }
}

export const getAdminCharacters: Handler = async (c) => {
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
        id: true,
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
      where: {
        AND: [{ unit: { code: { not: "vs" } } }, { code: { notIn: excludedCodes } }],
      },
    })

    const response: AdminCharacterListResponse = {
      data: {
        characters: characters.map((character) => ({
          avatarUrl: character.avatarUrl,
          bgColor: character.bgColor,
          code: character.code,
          color: character.color,
          id: character.id,
          name: character.name,
          short: character.short,
          unit: character.unit
            ? {
                bgColor: character.unit.bgColor,
                code: character.unit.code,
                color: character.unit.color,
                name: character.unit.name,
                short: character.unit.short,
              }
            : null,
        })),
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
