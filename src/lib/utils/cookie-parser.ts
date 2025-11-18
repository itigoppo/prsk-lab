/**
 * Cookie ヘッダー文字列をパースしてオブジェクトに変換する
 *
 * @param cookieHeader - Cookie ヘッダー文字列 (例: "key1=value1; key2=value2")
 * @returns パースされた Cookie オブジェクト
 *
 * @example
 * ```typescript
 * parseCookies("session=abc123; user=john")
 * // => { session: "abc123", user: "john" }
 *
 * // 値に = が含まれる場合も正しく処理
 * parseCookies("token=abc=def=ghi")
 * // => { token: "abc=def=ghi" }
 * ```
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader || cookieHeader.trim() === "") {
    return {}
  }

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => {
        const trimmed = v.trim()
        const [key, ...values] = trimmed.split("=")
        return [key, values.join("=")]
      })
      .filter(([key, value]) => !!key && !!value)
  )
}
