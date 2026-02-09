import { z } from "zod"

/**
 * 全角・半角空白をトリムする
 * - 半角スペース、タブ、改行など（\s）
 * - 全角スペース（U+3000）
 */
export const trimFullWidth = (s: string): string => s.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "")

/**
 * 必須文字列（全角空白対応トリム + 空文字不可）
 * @param message - 空文字時のエラーメッセージ
 * @param options.max - 最大文字数
 * @param options.maxMessage - 最大文字数超過時のエラーメッセージ
 *
 * @example
 * zString("タグIDは必須です")
 * zString("家具名は必須です", { max: 100, maxMessage: "家具名は100文字以内で入力してください" })
 */
export const zString = (message = "必須です", options?: { max?: number; maxMessage?: string }) => {
  let schema = z.string().min(1, message)
  if (options?.max) {
    schema = schema.max(options.max, options.maxMessage)
  }
  return z.string().transform(trimFullWidth).pipe(schema)
}

/**
 * nullable文字列（null許可、文字列の場合はトリム + 空文字不可）
 * @param message - 空文字時のエラーメッセージ
 * @param options.max - 最大文字数
 * @param options.maxMessage - 最大文字数超過時のエラーメッセージ
 *
 * @example
 * zNullableString("グループIDは必須です") // null or 有効な文字列
 */
export const zNullableString = (
  message = "必須です",
  options?: { max?: number; maxMessage?: string }
) => {
  let schema = z.string().min(1, message)
  if (options?.max) {
    schema = schema.max(options.max, options.maxMessage)
  }
  return z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : trimFullWidth(v)))
    .pipe(schema.nullable())
}

/**
 * Zodバリデーションエラーをフィールドごとのエラーメッセージに変換
 * @param zodError - Zodバリデーションエラー
 * @returns フィールド名をキーとしたエラーメッセージのオブジェクト
 *
 * @example
 * // ネストしたパスの例: furnitures[0].groupId → "furnitures[0].groupId"
 * formatZodErrors(zodError)
 * // => { "furnitures[0].groupId": "キャラクターIDは必須です" }
 */
export const formatZodErrors = (zodError: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {}

  zodError.issues.forEach((issue) => {
    // パスを読みやすい形式に変換 (例: ["furnitures", 0, "groupId"] → "furnitures[0].groupId")
    const path = issue.path
      .map((p, i) => (typeof p === "number" ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
      .join("")

    if (path && !errors[path]) {
      errors[path] = issue.message
    }
  })

  return errors
}
