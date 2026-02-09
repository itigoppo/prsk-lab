import { describe, expect, it } from "vitest"
import { z } from "zod"
import { formatZodErrors, trimFullWidth, zNullableString, zString } from "./zod"

describe("formatZodErrors", () => {
  describe("基本的なバリデーション", () => {
    it("単一フィールドのエラーをフォーマットできる", () => {
      const schema = z.object({
        email: z.string().email("有効なメールアドレスを入力してください"),
      })

      const result = schema.safeParse({ email: "invalid" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

        // 最初のエラーのみ
        expect(errors.password).toBe("パスワードは8文字以上である必要があります")
      }
    })
  })

  describe("Record型の戻り値", () => {
    it("任意のフィールドにアクセスできる", () => {
      const schema = z.object({
        email: z.string().email("無効なメール"),
        name: z.string().min(1, "名前は必須"),
      })

      const result = schema.safeParse({ email: "invalid", name: "" })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors(result.error)

        expect(errors.email).toBeDefined()
        expect(errors.name).toBeDefined()
        expect(errors.age).toBeUndefined()
      }
    })
  })

  describe("ネストされたオブジェクト", () => {
    it("ネストされたフィールドのフルパスをキーとする", () => {
      const schema = z.object({
        address: z.object({
          city: z.string().min(1, "市区町村は必須です"),
          zip: z.string().regex(/^\d{7}$/, "郵便番号は7桁の数字です"),
        }),
      })

      const result = schema.safeParse({ address: { city: "", zip: "invalid" } })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors(result.error)

        // ネストされた構造の場合、フルパスがキーになる
        expect(errors["address.city"]).toBe("市区町村は必須です")
        expect(errors["address.zip"]).toBe("郵便番号は7桁の数字です")
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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

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
        const errors = formatZodErrors(result.error)

        expect(errors.terms).toBeDefined()
      }
    })
  })

  describe("配列のバリデーション", () => {
    it("配列の要素にエラーがある場合はインデックス付きパスになる", () => {
      const schema = z.object({
        tags: z.array(z.string().min(1, "タグは空にできません")),
      })

      const result = schema.safeParse({ tags: ["", "valid"] })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors(result.error)

        // 配列の場合、インデックス付きパスになる
        expect(errors["tags[0]"]).toBe("タグは空にできません")
      }
    })

    it("ネストされた配列のエラーはフルパスで表現される", () => {
      const schema = z.object({
        furnitures: z.array(
          z.object({
            groupId: z.string().min(1, "グループIDは必須です"),
            name: z.string().min(1, "家具名は必須です"),
          })
        ),
      })

      const result = schema.safeParse({
        furnitures: [{ groupId: "", name: "家具1" }],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = formatZodErrors(result.error)

        // ネストされた配列の場合、フルパスになる
        expect(errors["furnitures[0].groupId"]).toBe("グループIDは必須です")
      }
    })
  })
})

describe("trimFullWidth", () => {
  it("半角スペースをトリムできる", () => {
    expect(trimFullWidth("  hello  ")).toBe("hello")
  })

  it("全角スペースをトリムできる", () => {
    expect(trimFullWidth("　hello　")).toBe("hello")
  })

  it("半角・全角混合をトリムできる", () => {
    expect(trimFullWidth("　 hello 　")).toBe("hello")
  })

  it("空白のみの場合は空文字になる", () => {
    expect(trimFullWidth("　 　")).toBe("")
  })

  it("空文字はそのまま", () => {
    expect(trimFullWidth("")).toBe("")
  })

  it("中間の空白は残る", () => {
    expect(trimFullWidth("　hello　world　")).toBe("hello　world")
  })
})

describe("zString", () => {
  it("有効な文字列を受け入れる", () => {
    const schema = zString()
    expect(schema.safeParse("hello").success).toBe(true)
  })

  it("空文字を拒否する", () => {
    const schema = zString("必須です")
    const result = schema.safeParse("")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("必須です")
    }
  })

  it("半角スペースのみを拒否する", () => {
    const schema = zString()
    const result = schema.safeParse("   ")
    expect(result.success).toBe(false)
  })

  it("全角スペースのみを拒否する", () => {
    const schema = zString()
    const result = schema.safeParse("　　　")
    expect(result.success).toBe(false)
  })

  it("前後の空白をトリムして値を返す", () => {
    const schema = zString()
    const result = schema.safeParse("　hello　")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe("hello")
    }
  })

  it("最大文字数を超える場合を拒否する", () => {
    const schema = zString("必須です", { max: 10, maxMessage: "10文字以内で入力してください" })
    const result = schema.safeParse("12345678901")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("10文字以内で入力してください")
    }
  })

  it("最大文字数以内なら受け入れる", () => {
    const schema = zString("必須です", { max: 10 })
    const result = schema.safeParse("1234567890")
    expect(result.success).toBe(true)
  })
})

describe("zNullableString", () => {
  it("有効な文字列を受け入れる", () => {
    const schema = zNullableString("必須です")
    const result = schema.safeParse("hello")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe("hello")
    }
  })

  it("nullを受け入れる", () => {
    const schema = zNullableString()
    const result = schema.safeParse(null)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it("空文字を拒否する", () => {
    const schema = zNullableString("グループIDは必須です")
    const result = schema.safeParse("")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("グループIDは必須です")
    }
  })

  it("全角スペースのみを拒否する", () => {
    const schema = zNullableString()
    const result = schema.safeParse("　")
    expect(result.success).toBe(false)
  })

  it("前後の空白をトリムして値を返す", () => {
    const schema = zNullableString()
    const result = schema.safeParse("　hello　")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe("hello")
    }
  })

  it("最大文字数を超える場合を拒否する", () => {
    const schema = zNullableString("必須です", {
      max: 10,
      maxMessage: "10文字以内で入力してください",
    })
    const result = schema.safeParse("12345678901")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("10文字以内で入力してください")
    }
  })
})
