import { describe, expect, it } from "vitest"
import { parseCookies } from "./cookie-parser"

describe("parseCookies", () => {
  describe("基本的な動作", () => {
    it("単一のCookieを正しくパースできる", () => {
      const result = parseCookies("session=abc123")

      expect(result).toEqual({
        session: "abc123",
      })
    })

    it("複数のCookieを正しくパースできる", () => {
      const result = parseCookies("session=abc123; user=john; theme=dark")

      expect(result).toEqual({
        session: "abc123",
        theme: "dark",
        user: "john",
      })
    })

    it("空白を含むCookie文字列を正しくパースできる", () => {
      const result = parseCookies("session=abc123 ;  user=john  ; theme=dark")

      expect(result).toEqual({
        session: "abc123",
        theme: "dark",
        user: "john",
      })
    })
  })

  describe("= を含む値の処理", () => {
    it("値に = が1つ含まれる場合も正しくパースできる", () => {
      const result = parseCookies("token=abc=def")

      expect(result).toEqual({
        token: "abc=def",
      })
    })

    it("値に = が複数含まれる場合も正しくパースできる", () => {
      const result = parseCookies("token=abc=def=ghi")

      expect(result).toEqual({
        token: "abc=def=ghi",
      })
    })

    it("複数のCookieで一部の値に = が含まれる", () => {
      const result = parseCookies("session=abc123; token=def=ghi; user=john")

      expect(result).toEqual({
        session: "abc123",
        token: "def=ghi",
        user: "john",
      })
    })

    it("JWT トークンのような長い値も正しくパースできる", () => {
      const jwtToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
      const result = parseCookies(`auth_token=${jwtToken}`)

      expect(result).toEqual({
        auth_token: jwtToken,
      })
    })
  })

  describe("エッジケース", () => {
    it("空文字列の場合は空オブジェクトを返す", () => {
      const result = parseCookies("")

      expect(result).toEqual({})
    })

    it("空白のみの場合は空オブジェクトを返す", () => {
      const result = parseCookies("   ")

      expect(result).toEqual({})
    })

    it("値が空のCookieは除外される", () => {
      const result = parseCookies("session=abc123; empty=; user=john")

      expect(result).toEqual({
        session: "abc123",
        user: "john",
      })
    })

    it("キーが空のCookieは除外される", () => {
      const result = parseCookies("session=abc123; =value; user=john")

      expect(result).toEqual({
        session: "abc123",
        user: "john",
      })
    })

    it("不正な形式のCookieが混在していても正しいものはパースされる", () => {
      const result = parseCookies("session=abc123; invalid; user=john; =; =value")

      expect(result).toEqual({
        session: "abc123",
        user: "john",
      })
    })
  })

  describe("実際のユースケース", () => {
    it("NextAuth セッショントークンを正しくパースできる", () => {
      const result = parseCookies("next-auth.session-token=eyJhbGc.eyJzdWI.signature")

      expect(result).toEqual({
        "next-auth.session-token": "eyJhbGc.eyJzdWI.signature",
      })
    })

    it("__Secure プレフィックス付きCookieを正しくパースできる", () => {
      const result = parseCookies("__Secure-next-auth.session-token=token_value")

      expect(result).toEqual({
        "__Secure-next-auth.session-token": "token_value",
      })
    })

    it("複数のセッション関連Cookieを正しくパースできる", () => {
      const result = parseCookies(
        "next-auth.session-token=session_token; next-auth.csrf-token=csrf_token; other=value"
      )

      expect(result).toEqual({
        "next-auth.csrf-token": "csrf_token",
        "next-auth.session-token": "session_token",
        other: "value",
      })
    })
  })
})
