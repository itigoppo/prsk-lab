import { z } from "zod"

/**
 * Zodバリデーションエラーをフィールドごとのエラーメッセージに変換
 * @param zodError - Zodバリデーションエラー
 * @returns フィールド名をキーとしたエラーメッセージのオブジェクト
 */
export const formatZodErrors = <T extends Record<string, unknown>>(
  zodError: z.ZodError
): Partial<Record<keyof T, string>> => {
  const errors: Partial<Record<keyof T, string>> = {}

  zodError.issues.forEach((issue) => {
    const field = issue.path[0] as keyof T
    if (field && !errors[field]) {
      // 最初のエラーメッセージのみ保持
      errors[field] = issue.message
    }
  })

  return errors
}
