import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"
import type { MiddlewareHandler } from "hono"

/**
 * ロールベースの認可ミドルウェア
 * 指定されたロールのいずれかを持つユーザーのみアクセスを許可する
 *
 * 注意: verifyNextAuthSession ミドルウェアの後に使用すること
 */
export const requireRole = (allowedRoles: UserRole[]): MiddlewareHandler => {
  return async (c, next) => {
    const discordId = c.get("discordId")

    if (!discordId) {
      return c.json({ message: "認証が必要です", success: false }, HTTP_STATUS.UNAUTHORIZED)
    }

    try {
      const user = await prisma.user.findUnique({
        select: { role: true },
        where: { discordId },
      })

      if (!user) {
        return c.json(
          { message: "ユーザーが見つかりません", success: false },
          HTTP_STATUS.NOT_FOUND
        )
      }

      if (!allowedRoles.includes(user.role)) {
        return c.json(
          { message: "この操作を行う権限がありません", success: false },
          HTTP_STATUS.FORBIDDEN
        )
      }

      c.set("userRole", user.role)
      await next()
    } catch {
      return c.json(
        { message: "認証処理中にエラーが発生しました", success: false },
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}

/**
 * Editor または Admin ロールを要求するミドルウェア
 */
export const requireEditorOrAdmin: MiddlewareHandler = requireRole(["Editor", "Admin"])

/**
 * Admin ロールのみを要求するミドルウェア
 */
export const requireAdmin: MiddlewareHandler = requireRole(["Admin"])
