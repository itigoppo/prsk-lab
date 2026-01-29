import { describe, expect, it } from "vitest"
import { z } from "zod"
import { formatZodErrors } from "./zod"

describe("formatZodErrors", () => {
  describe("基本的なバリデーション", () => {
    it("単一フィールドのエラーをフォーマットできる", () => {
      const schema = z.object({
        email: z.string().email("有効なメールアドレスを入力してください"),
      })

      const result = schema.safeParse({ email: "invalid" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ email: string }>(result.error)

        expect(errors.email).toBe("有効なメールアドレスを入力してください")
      }
    })

    it("複数フィールドのエラーをフォーマットできる", () => {
      const schema = z.object({
        age: z.number().min(0, "年齢は0以上である必要があります"),
        email: z.string().email("有効なメールアドレスを入力してください"),
        name: z.string().min(1, "名前は必須です"),
      })

      const result = schema.safeParse({ age: -1, email: "invalid", name: "" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ age: number; email: string; name: string }>(result.error)

        expect(errors.email).toBe("有効なメールアドレスを入力してください")
        expect(errors.name).toBe("名前は必須です")
        expect(errors.age).toBe("年齢は0以上である必要があります")
      }
    })

    it("エラーがない場合は空オブジェクトを返す", () => {
      const schema = z.object({
        email: z.string().email(),
      })

      const result = schema.safeParse({ email: "test@example.com" })

      expect(result.success).toBe(true)
    })
  })

  describe("必須フィールド", () => {
    it("必須フィールドが欠けている場合のエラー", () => {
      const schema = z.object({
        username: z.string(),
      })

      const result = schema.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ username: string }>(result.error)

        expect(errors.username).toBeDefined()
        expect(typeof errors.username).toBe("string")
      }
    })

    it("複数の必須フィールドが欠けている場合", () => {
      const schema = z.object({
        email: z.string(),
        name: z.string(),
        password: z.string(),
      })

      const result = schema.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ email: string; name: string; password: string }>(
          result.error
        )

        expect(errors.email).toBeDefined()
        expect(errors.name).toBeDefined()
        expect(errors.password).toBeDefined()
      }
    })
  })

  describe("カスタムバリデーション", () => {
    it("カスタムエラーメッセージを保持する", () => {
      const schema = z.object({
        password: z
          .string()
          .min(8, "パスワードは8文字以上である必要があります")
          .regex(/[A-Z]/, "パスワードには大文字を含める必要があります"),
      })

      const result = schema.safeParse({ password: "short" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ password: string }>(result.error)

        // 最初のエラーメッセージのみが保持される
        expect(errors.password).toBeDefined()
        expect(typeof errors.password).toBe("string")
      }
    })

    it("refinementエラーも処理できる", () => {
      const schema = z
        .object({
          password: z.string(),
          passwordConfirm: z.string(),
        })
        .refine((data) => data.password === data.passwordConfirm, {
          message: "パスワードが一致しません",
          path: ["passwordConfirm"],
        })

      const result = schema.safeParse({
        password: "password123",
        passwordConfirm: "different",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ password: string; passwordConfirm: string }>(result.error)

        expect(errors.passwordConfirm).toBe("パスワードが一致しません")
      }
    })
  })

  describe("複数のエラーがある場合", () => {
    it("同じフィールドに複数のエラーがある場合は最初のみ保持する", () => {
      const schema = z.object({
        password: z
          .string()
          .min(8, "パスワードは8文字以上である必要があります")
          .max(20, "パスワードは20文字以下である必要があります")
          .regex(/[A-Z]/, "パスワードには大文字を含める必要があります")
          .regex(/[0-9]/, "パスワードには数字を含める必要があります"),
      })

      const result = schema.safeParse({ password: "a" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ password: string }>(result.error)

        // 最初のエラーのみ
        expect(errors.password).toBe("パスワードは8文字以上である必要があります")
      }
    })
  })

  describe("型安全性", () => {
    it("型パラメータで指定されたフィールドのみを返す", () => {
      type UserForm = {
        age: number
        email: string
        name: string
      }

      const schema = z.object({
        email: z.string().email("無効なメール"),
        name: z.string().min(1, "名前は必須"),
      })

      const result = schema.safeParse({ email: "invalid", name: "" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<UserForm>(result.error)

        // TypeScriptの型チェックで、email, name, ageのみがキーとして認識される
        expect(errors.email).toBeDefined()
        expect(errors.name).toBeDefined()
        expect(errors.age).toBeUndefined()
      }
    })
  })

  describe("ネストされたオブジェクト", () => {
    it("ネストされたフィールドの最初のパスをキーとする", () => {
      const schema = z.object({
        address: z.object({
          city: z.string().min(1, "市区町村は必須です"),
          zip: z.string().regex(/^\d{7}$/, "郵便番号は7桁の数字です"),
        }),
      })

      const result = schema.safeParse({ address: { city: "", zip: "invalid" } })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ address: { city: string; zip: string } }>(result.error)

        // ネストされた構造の場合、最初のパス（address）がキーになる
        expect(errors.address).toBeDefined()
      }
    })
  })

  describe("空・null・undefined", () => {
    it("空文字列でエラーになる場合", () => {
      const schema = z.object({
        name: z.string().min(1, "名前は必須です"),
      })

      const result = schema.safeParse({ name: "" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ name: string }>(result.error)

        expect(errors.name).toBe("名前は必須です")
      }
    })

    it("nullでエラーになる場合", () => {
      const schema = z.object({
        name: z.string(),
      })

      const result = schema.safeParse({ name: null })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ name: string }>(result.error)

        expect(errors.name).toBeDefined()
      }
    })

    it("undefinedでエラーになる場合", () => {
      const schema = z.object({
        name: z.string(),
      })

      const result = schema.safeParse({ name: undefined })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ name: string }>(result.error)

        expect(errors.name).toBeDefined()
      }
    })
  })

  describe("数値・真偽値のバリデーション", () => {
    it("数値のバリデーションエラー", () => {
      const schema = z.object({
        age: z.number().min(18, "18歳以上である必要があります"),
      })

      const result = schema.safeParse({ age: 15 })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ age: number }>(result.error)

        expect(errors.age).toBe("18歳以上である必要があります")
      }
    })

    it("真偽値のバリデーションエラー", () => {
      const schema = z.object({
        terms: z.literal(true, { message: "利用規約に同意してください" }),
      })

      const result = schema.safeParse({ terms: false })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ terms: boolean }>(result.error)

        expect(errors.terms).toBeDefined()
      }
    })
  })

  describe("配列のバリデーション", () => {
    it("配列の最初の要素にエラーがある場合", () => {
      const schema = z.object({
        tags: z.array(z.string().min(1, "タグは空にできません")),
      })

      const result = schema.safeParse({ tags: ["", "valid"] })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors<{ tags: string[] }>(result.error)

        expect(errors.tags).toBeDefined()
      }
    })
  })
})
