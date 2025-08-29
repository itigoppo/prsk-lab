import { z } from "zod"

// スキーマからエラー型を自動生成するユーティリティ型
export type SchemaErrors<T> = {
  [K in keyof T]?: string
}

// スキーマからエラーオブジェクトを自動生成する関数
export const createErrorObject = <T extends z.ZodSchema>(): SchemaErrors<z.infer<T>> => {
  return {} as SchemaErrors<z.infer<T>>
}

// Zodエラーをフロントエンド用のエラー形式に変換する共通関数
export const convertZodErrors = <T extends z.ZodSchema>(
  zodError: z.ZodError,
  _schema: T // 型定義用なので未使用だけど消さない
): SchemaErrors<z.infer<T>> => {
  const errors = createErrorObject<T>()

  zodError.issues.forEach((issue) => {
    const field = issue.path[0] as keyof z.infer<T>
    if (field) {
      errors[field] = issue.message
    }
  })

  return errors
}
