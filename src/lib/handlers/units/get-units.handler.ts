import { HTTP_STATUS } from "@/constants/http-status"
import { Tags, commonResponses, jsonResponse } from "@/lib/hono/openapi-helpers"
import { prisma } from "@/lib/prisma"
import {
  UnitListItem,
  UnitListResponse,
  unitListResponseSchema,
} from "@/lib/schemas/response/unit.response"
import { createRoute, type RouteHandler } from "@hono/zod-openapi"
import { Prisma } from "@prisma/client"

export const getUnitsRoute = createRoute({
  description: "ユニット一覧を取得する",
  method: "get",
  path: "/api/units",
  responses: {
    ...jsonResponse(HTTP_STATUS.OK, unitListResponseSchema, "ユニット一覧を取得しました"),
    ...commonResponses.internalServerError,
  },
  summary: "ユニット一覧取得",
  tags: [Tags.UNITS.name],
})

export const getUnits: RouteHandler<typeof getUnitsRoute> = async (c) => {
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

    return c.json(response, HTTP_STATUS.OK)
  } catch {
    return c.json(
      { message: "ユニット情報の取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
