import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// 認証が必要なパス
const PROTECTED_PATHS = ["/mysekai", "/settings", "/admin"]

export const middleware = async (req: NextRequest) => {
  const token = await getToken({ req })
  const isAuthenticated = !!token

  const pathname = req.nextUrl.pathname
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtected && !isAuthenticated) {
    return redirectToLogin(req, pathname)
  }

  return NextResponse.next()
}

// 未ログイン → /login にリダイレクト、かつ戻る先をクエリに入れる
const redirectToLogin = (req: NextRequest, callbackPath?: string) => {
  const loginUrl = new URL("/login", req.url)
  const pathname = callbackPath || req.nextUrl.pathname

  loginUrl.searchParams.set("callbackUrl", pathname)

  return NextResponse.redirect(loginUrl)
}
