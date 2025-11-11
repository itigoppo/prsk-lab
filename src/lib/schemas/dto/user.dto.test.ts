import { describe, expect, it } from "vitest"
import { createUserDtoSchema } from "./user"

describe("User DTO Schemas", () => {
  describe("createUserDtoSchema", () => {
    describe("正常系", () => {
      it("全てのフィールドが有効な値の場合にパースできる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "https://cdn.example.com/avatar.png",
          discordId: "123456789",
          email: "test@example.com",
          name: "Test User",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.avatarUrl).toBe("https://cdn.example.com/avatar.png")
          expect(result.data.discordId).toBe("123456789")
          expect(result.data.email).toBe("test@example.com")
          expect(result.data.name).toBe("Test User")
        }
      })

      it("必須項目のdiscordIdのみでパースできる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "123456789",
          email: null,
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.discordId).toBe("123456789")
          expect(result.data.avatarUrl).toBeNull()
          expect(result.data.email).toBeNull()
          expect(result.data.name).toBeNull()
        }
      })

      it("avatarUrlがnullの場合", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "123456789",
          email: "test@example.com",
          name: "Test User",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.avatarUrl).toBeNull()
        }
      })

      it("emailがnullの場合", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "https://cdn.example.com/avatar.png",
          discordId: "123456789",
          email: null,
          name: "Test User",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBeNull()
        }
      })

      it("nameがnullの場合", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "https://cdn.example.com/avatar.png",
          discordId: "123456789",
          email: "test@example.com",
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBeNull()
        }
      })

      it("前後の空白はトリムされる - discordId", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "  123456789  ",
          email: null,
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.discordId).toBe("123456789")
        }
      })

      it("前後の空白はトリムされる - avatarUrl", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "  https://cdn.example.com/avatar.png  ",
          discordId: "123456789",
          email: null,
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.avatarUrl).toBe("https://cdn.example.com/avatar.png")
        }
      })

      it("前後の空白はトリムされる - email", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "123456789",
          email: "  test@example.com  ",
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBe("test@example.com")
        }
      })

      it("前後の空白はトリムされる - name", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "123456789",
          email: null,
          name: "  Test User  ",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe("Test User")
        }
      })

      it("Discord CDN URLを正しく処理できる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "https://cdn.discordapp.com/avatars/123456789/abc123.png",
          discordId: "123456789",
          email: "test@example.com",
          name: "Test User",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.avatarUrl).toContain("cdn.discordapp.com")
        }
      })
    })

    describe("異常系", () => {
      it("discordIdが空文字の場合はエラーになる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "",
          email: null,
          name: null,
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Discord IDは必須です")
        }
      })

      it("discordIdが空白のみの場合はエラーになる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "   ",
          email: null,
          name: null,
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Discord IDは必須です")
        }
      })

      it("discordIdがnullの場合はエラーになる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: null,
          email: null,
          name: null,
        })

        expect(result.success).toBe(false)
      })

      it("discordIdがundefinedの場合はエラーになる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          email: null,
          name: null,
        })

        expect(result.success).toBe(false)
      })

      it("discordIdが数値の場合はエラーになる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: 123456789,
          email: null,
          name: null,
        })

        expect(result.success).toBe(false)
      })
    })

    describe("エッジケース", () => {
      it("空文字列はトリム後に検証される", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: "",
          discordId: "123456789",
          email: "",
          name: "",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          // 空文字列はトリムされて空文字列のまま（nullではない）
          expect(result.data.avatarUrl).toBe("")
          expect(result.data.email).toBe("")
          expect(result.data.name).toBe("")
        }
      })

      it("特殊文字を含むnameを処理できる", () => {
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: "123456789",
          email: null,
          name: "Test User 🎮",
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe("Test User 🎮")
        }
      })

      it("長いdiscordIdを処理できる", () => {
        const longId = "1234567890123456789"
        const result = createUserDtoSchema.safeParse({
          avatarUrl: null,
          discordId: longId,
          email: null,
          name: null,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.discordId).toBe(longId)
        }
      })
    })
  })
})
