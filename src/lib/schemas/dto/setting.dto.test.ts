import { describe, expect, it } from "vitest"
import { createSettingDtoSchema, updateSettingDtoSchema } from "./setting"

describe("Setting DTO Schemas", () => {
  describe("createSettingDtoSchema", () => {
    describe("正常系", () => {
      it("有効なHTTPS URLをパースできる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "https://example.com/sheet.csv",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBe("https://example.com/sheet.csv")
        }
      })

      it("有効なHTTP URLをパースできる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "http://example.com/sheet.csv",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBe("http://example.com/sheet.csv")
        }
      })

      it("空文字列はnullに変換される", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBeNull()
        }
      })

      it("nullはnullのまま", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBeNull()
        }
      })

      it("前後の空白はトリムされる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "  https://example.com/sheet.csv  ",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBe("https://example.com/sheet.csv")
        }
      })

      it("空白のみの文字列はnullに変換される", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "   ",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBeNull()
        }
      })

      it("Google Sheets CSV URLをパースできる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl:
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxXxXxXxX/pub?output=csv",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toContain("docs.google.com")
        }
      })
    })

    describe("異常系", () => {
      it("無効なURL形式はエラーになる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "not-a-valid-url",
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("有効なURLを入力してください")
        }
      })

      it("スキームなしのURLはエラーになる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "example.com/sheet.csv",
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("有効なURLを入力してください")
        }
      })

      it("相対パスはエラーになる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "/path/to/sheet.csv",
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("有効なURLを入力してください")
        }
      })

      it("ランダムな文字列はエラーになる", () => {
        const result = createSettingDtoSchema.safeParse({
          leaderSheetUrl: "invalid string with spaces",
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("有効なURLを入力してください")
        }
      })
    })
  })

  describe("updateSettingDtoSchema", () => {
    describe("正常系", () => {
      it("有効なURLをパースできる", () => {
        const result = updateSettingDtoSchema.safeParse({
          leaderSheetUrl: "https://example.com/sheet.csv",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBe("https://example.com/sheet.csv")
        }
      })

      it("空文字列でURLをクリアできる（nullに変換）", () => {
        const result = updateSettingDtoSchema.safeParse({
          leaderSheetUrl: "",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBeNull()
        }
      })

      it("nullでURLをクリアできる", () => {
        const result = updateSettingDtoSchema.safeParse({
          leaderSheetUrl: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.leaderSheetUrl).toBeNull()
        }
      })
    })

    describe("異常系", () => {
      it("無効なURLはエラーになる", () => {
        const result = updateSettingDtoSchema.safeParse({
          leaderSheetUrl: "invalid-url",
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("有効なURLを入力してください")
        }
      })
    })

    describe("createとupdateの一貫性", () => {
      it("createとupdateで同じバリデーションルールを持つ", () => {
        const testCases = [
          { leaderSheetUrl: "https://example.com" },
          { leaderSheetUrl: "" },
          { leaderSheetUrl: null },
          { leaderSheetUrl: "invalid" },
        ]

        testCases.forEach((testCase) => {
          const createResult = createSettingDtoSchema.safeParse(testCase)
          const updateResult = updateSettingDtoSchema.safeParse(testCase)

          expect(createResult.success).toBe(updateResult.success)

          if (createResult.success && updateResult.success) {
            expect(createResult.data).toEqual(updateResult.data)
          }
        })
      })
    })
  })
})
