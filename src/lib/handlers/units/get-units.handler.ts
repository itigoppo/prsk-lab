import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { UnitListItem, UnitListResponse } from "@/lib/schemas/response/unit.response"
import { Prisma } from "@prisma/client"
import type { Handler } from "hono"

export const getUnits: Handler = async (c) => {
  try {
    const units = await prisma.unit.findMany({
      orderBy: {
        priority: Prisma.SortOrder.asc,
      },
      select: {
        bgColor: true,
        code: true,
        color: true,
        name: true,
        short: true,
      },
    })

    const response: UnitListResponse = {
      data: {
        units: units.map((unit) => {
          const item: UnitListItem = {
            bgColor: unit.bgColor,
            code: unit.code,
            color: unit.color,
            name: unit.name,
            short: unit.short,
          }

          return item
        }),
      },
      message: "ユニット情報を取得しました",
      success: true,
    }

    return c.json(response)
  } catch {
    return c.json(
      { message: "ユニット情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
