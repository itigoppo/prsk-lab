import { describe, expect, it } from "vitest"
import { getUserDisplayName, getUserInitials, isJapaneseName, type UserNameData } from "./user"

describe("user utils", () => {
  describe("isJapaneseName", () => {
    describe("日本語名", () => {
      it("ひらがなの名前をtrueと判定する", () => {
        expect(isJapaneseName("たろう")).toBe(true)
      })

      it("カタカナの名前をtrueと判定する", () => {
        expect(isJapaneseName("タロウ")).toBe(true)
      })

      it("漢字の名前をtrueと判定する", () => {
        expect(isJapaneseName("太郎")).toBe(true)
      })

      it("混合した日本語名をtrueと判定する", () => {
        expect(isJapaneseName("山田太郎")).toBe(true)
      })

      it("ひらがなで始まる混合名をtrueと判定する", () => {
        expect(isJapaneseName("たろうSmith")).toBe(true)
      })
    })

    describe("英語名", () => {
      it("英語の名前をfalseと判定する", () => {
        expect(isJapaneseName("John")).toBe(false)
      })

      it("大文字小文字混合の英語名をfalseと判定する", () => {
        expect(isJapaneseName("JohnDoe")).toBe(false)
      })

      it("小文字のみの英語名をfalseと判定する", () => {
        expect(isJapaneseName("john")).toBe(false)
      })

      it("英語で始まる混合名をfalseと判定する", () => {
        expect(isJapaneseName("Johnたろう")).toBe(false)
      })
    })

    describe("エッジケース", () => {
      it("nullはfalseを返す", () => {
        expect(isJapaneseName(null)).toBe(false)
      })

      it("空文字列はfalseを返す", () => {
        expect(isJapaneseName("")).toBe(false)
      })

      it("数字のみはfalseを返す", () => {
        expect(isJapaneseName("123")).toBe(false)
      })

      it("記号のみはfalseを返す", () => {
        expect(isJapaneseName("@#$")).toBe(false)
      })

      it("スペースで始まる日本語名はfalseを返す", () => {
        expect(isJapaneseName(" 太郎")).toBe(false)
      })

      it("全角スペースで始まる名前をtrueと判定する", () => {
        expect(isJapaneseName("　太郎")).toBe(true)
      })
    })
  })

  describe("getUserDisplayName", () => {
    describe("正常系", () => {
      it("名前がある場合はその名前を返す", () => {
        const user: UserNameData = { name: "太郎" }
        expect(getUserDisplayName(user)).toBe("太郎")
      })

      it("英語名を正しく返す", () => {
        const user: UserNameData = { name: "John Doe" }
        expect(getUserDisplayName(user)).toBe("John Doe")
      })

      it("長い名前を正しく返す", () => {
        const user: UserNameData = { name: "山田 太郎 次郎" }
        expect(getUserDisplayName(user)).toBe("山田 太郎 次郎")
      })

      it("特殊文字を含む名前を正しく返す", () => {
        const user: UserNameData = { name: "User🎮" }
        expect(getUserDisplayName(user)).toBe("User🎮")
      })
    })

    describe("フォールバック", () => {
      it("名前がnullの場合は「ユーザー」を返す", () => {
        const user: UserNameData = { name: null }
        expect(getUserDisplayName(user)).toBe("ユーザー")
      })

      it("名前が空文字列の場合は「ユーザー」を返す", () => {
        const user: UserNameData = { name: "" }
        expect(getUserDisplayName(user)).toBe("ユーザー")
      })
    })
  })

  describe("getUserInitials", () => {
    describe("日本語名", () => {
      it("漢字2文字の名前からそのまま2文字を返す", () => {
        const user: UserNameData = { name: "太郎" }
        expect(getUserInitials(user)).toBe("太郎")
      })

      it("漢字3文字以上の名前から最初の2文字を返す", () => {
        const user: UserNameData = { name: "山田太郎" }
        expect(getUserInitials(user)).toBe("山田")
      })

      it("ひらがなの名前から最初の2文字を返す", () => {
        const user: UserNameData = { name: "たろう" }
        expect(getUserInitials(user)).toBe("たろ")
      })

      it("カタカナの名前から最初の2文字を返す", () => {
        const user: UserNameData = { name: "タロウ" }
        expect(getUserInitials(user)).toBe("タロ")
      })

      it("日本語1文字の名前はその1文字を返す", () => {
        const user: UserNameData = { name: "太" }
        expect(getUserInitials(user)).toBe("太")
      })
    })

    describe("英語名", () => {
      it("英語の名前から最初の2文字を大文字で返す", () => {
        const user: UserNameData = { name: "john" }
        expect(getUserInitials(user)).toBe("JO")
      })

      it("既に大文字の英語名から最初の2文字を返す", () => {
        const user: UserNameData = { name: "JOHN" }
        expect(getUserInitials(user)).toBe("JO")
      })

      it("混合ケースの英語名から最初の2文字を大文字で返す", () => {
        const user: UserNameData = { name: "JohnDoe" }
        expect(getUserInitials(user)).toBe("JO")
      })

      it("スペースを含む英語名から最初の2文字を大文字で返す", () => {
        const user: UserNameData = { name: "John Doe" }
        expect(getUserInitials(user)).toBe("JO")
      })

      it("英語1文字の名前は大文字1文字を返す", () => {
        const user: UserNameData = { name: "j" }
        expect(getUserInitials(user)).toBe("J")
      })
    })

    describe("エッジケース", () => {
      it("名前がnullの場合は「U」を返す", () => {
        const user: UserNameData = { name: null }
        expect(getUserInitials(user)).toBe("U")
      })

      it("名前が空文字列の場合は「U」を返す", () => {
        const user: UserNameData = { name: "" }
        expect(getUserInitials(user)).toBe("U")
      })

      it("日本語で始まる混合名は日本語として処理される", () => {
        const user: UserNameData = { name: "太郎john" }
        expect(getUserInitials(user)).toBe("太郎")
      })

      it("英語で始まる混合名は英語として処理される", () => {
        const user: UserNameData = { name: "john太郎" }
        expect(getUserInitials(user)).toBe("JO")
      })

      it("数字で始まる名前は英語として処理される（大文字化）", () => {
        const user: UserNameData = { name: "123abc" }
        expect(getUserInitials(user)).toBe("12")
      })

      it("記号を含む英語名は最初の2文字を大文字で返す", () => {
        const user: UserNameData = { name: "@user" }
        expect(getUserInitials(user)).toBe("@U")
      })

      it("絵文字を含む日本語名は最初の2文字を返す", () => {
        const user: UserNameData = { name: "太郎🎮" }
        expect(getUserInitials(user)).toBe("太郎")
      })
    })

    describe("実際のユースケース", () => {
      it("アバターに表示する日本語ユーザーのイニシャル", () => {
        const user: UserNameData = { name: "山田太郎" }
        const initials = getUserInitials(user)
        expect(initials).toBe("山田")
        expect(initials.length).toBeLessThanOrEqual(2)
      })

      it("アバターに表示する英語ユーザーのイニシャル", () => {
        const user: UserNameData = { name: "John Smith" }
        const initials = getUserInitials(user)
        expect(initials).toBe("JO")
        expect(initials).toMatch(/^[A-Z]+$/)
      })

      it("ゲストユーザーのデフォルトアバター", () => {
        const user: UserNameData = { name: null }
        const initials = getUserInitials(user)
        expect(initials).toBe("U")
      })
    })
  })
})
