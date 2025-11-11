import { describe, expect, it } from "vitest"
import { cn, isNavItemActive } from "./common"

describe("common utils", () => {
  describe("cn", () => {
    it("複数のクラス名をマージできる", () => {
      const result = cn("foo", "bar")
      expect(result).toBe("foo bar")
    })

    it("条件付きクラス名を処理できる", () => {
      const result = cn("base", true && "active", false && "disabled")
      expect(result).toBe("base active")
    })

    it("Tailwindの競合するクラスをマージする", () => {
      const result = cn("px-2", "px-4")
      expect(result).toBe("px-4")
    })

    it("undefinedやnullを無視する", () => {
      const result = cn("foo", undefined, null, "bar")
      expect(result).toBe("foo bar")
    })

    it("配列を処理できる", () => {
      const result = cn(["foo", "bar"], "baz")
      expect(result).toBe("foo bar baz")
    })

    it("空の入力で空文字列を返す", () => {
      const result = cn()
      expect(result).toBe("")
    })
  })

  describe("isNavItemActive", () => {
    describe("完全一致", () => {
      it("パスが完全一致する場合はtrueを返す", () => {
        expect(isNavItemActive("/about", "/about")).toBe(true)
      })

      it("ルートパスが完全一致する", () => {
        expect(isNavItemActive("/", "/")).toBe(true)
      })

      it("複数セグメントのパスが完全一致する", () => {
        expect(isNavItemActive("/users/profile", "/users/profile")).toBe(true)
      })
    })

    describe("プレフィックスマッチ", () => {
      it("サブパスの場合はtrueを返す", () => {
        expect(isNavItemActive("/users/123", "/users")).toBe(true)
      })

      it("深くネストされたパスもマッチする", () => {
        expect(isNavItemActive("/users/123/settings", "/users")).toBe(true)
      })

      it("複数セグメントのプレフィックスマッチ", () => {
        expect(isNavItemActive("/users/profile/edit", "/users/profile")).toBe(true)
      })
    })

    describe("末尾スラッシュの処理", () => {
      it("currentPathの末尾スラッシュは無視される", () => {
        expect(isNavItemActive("/about/", "/about")).toBe(true)
      })

      it("hrefの末尾スラッシュは無視される", () => {
        expect(isNavItemActive("/about", "/about/")).toBe(true)
      })

      it("両方に末尾スラッシュがあっても一致する", () => {
        expect(isNavItemActive("/about/", "/about/")).toBe(true)
      })

      it("ルートパスの末尾スラッシュ（currentPath）", () => {
        expect(isNavItemActive("/", "/")).toBe(true)
      })
    })

    describe("マッチしないケース", () => {
      it("完全に異なるパスはfalseを返す", () => {
        expect(isNavItemActive("/about", "/contact")).toBe(false)
      })

      it("プレフィックスが似ているが異なるパスはfalse", () => {
        expect(isNavItemActive("/users-admin", "/users")).toBe(false)
      })

      it("短いパスが長いパスのプレフィックスでない", () => {
        expect(isNavItemActive("/users", "/users/profile")).toBe(false)
      })

      it("ルートパスは他のパスともマッチする（正規化後空文字のため）", () => {
        // NOTE: "/" は末尾スラッシュ除去で "" になり、全てのパスが "" + "/" で始まるためマッチする
        expect(isNavItemActive("/about", "/")).toBe(true)
      })

      it("部分一致だけではマッチしない", () => {
        expect(isNavItemActive("/about", "/bout")).toBe(false)
      })
    })

    describe("エッジケース", () => {
      it("空文字列のパス", () => {
        expect(isNavItemActive("", "")).toBe(true)
      })

      it("空文字列hrefは全てのパスとマッチする", () => {
        // NOTE: 空文字列は "/" で始まるかチェックされるため、全てのパスがマッチする
        expect(isNavItemActive("/about", "")).toBe(true)
      })

      it("スラッシュのみのパス（正規化後空文字）", () => {
        // 末尾スラッシュ除去後、"/" → ""
        expect(isNavItemActive("/", "/")).toBe(true)
      })

      it("クエリパラメータはパスの一部として扱われる", () => {
        // NOTE: 実装はクエリパラメータを除去しないため、マッチしない
        expect(isNavItemActive("/search?q=test", "/search")).toBe(false)
      })

      it("ハッシュはパスの一部として扱われる", () => {
        // NOTE: 実装はハッシュを除去しないため、マッチしない
        expect(isNavItemActive("/about#section", "/about")).toBe(false)
      })

      it("大文字小文字は区別される", () => {
        expect(isNavItemActive("/About", "/about")).toBe(false)
      })
    })

    describe("実際のナビゲーションシナリオ", () => {
      it("ホームページ", () => {
        expect(isNavItemActive("/", "/")).toBe(true)
        // NOTE: "/" は正規化後 "" になるため、全てのパスとマッチする
        expect(isNavItemActive("/about", "/")).toBe(true)
      })

      it("設定ページとサブページ", () => {
        const settingsHref = "/settings"

        expect(isNavItemActive("/settings", settingsHref)).toBe(true)
        expect(isNavItemActive("/settings/profile", settingsHref)).toBe(true)
        expect(isNavItemActive("/settings/security", settingsHref)).toBe(true)
        expect(isNavItemActive("/about", settingsHref)).toBe(false)
      })

      it("複数のナビゲーション項目", () => {
        const currentPath = "/users/123"

        // NOTE: "/" は正規化後 "" になるため、マッチする
        expect(isNavItemActive(currentPath, "/")).toBe(true)
        expect(isNavItemActive(currentPath, "/users")).toBe(true)
        expect(isNavItemActive(currentPath, "/settings")).toBe(false)
        expect(isNavItemActive(currentPath, "/about")).toBe(false)
      })
    })
  })
})
