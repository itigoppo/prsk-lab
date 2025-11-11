import { describe, expect, it } from "vitest"
import { getApiErrorMessage } from "./error"

describe("getApiErrorMessage", () => {
  describe("Axios error", () => {
    it("Axios errorのresponse.data.messageを返す", () => {
      const axiosError = {
        response: {
          data: {
            message: "API エラーメッセージ",
          },
        },
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("API エラーメッセージ")
    })

    it("ネストされた構造が正しい場合のみメッセージを抽出する", () => {
      const axiosError = {
        response: {
          data: {
            message: "詳細なエラー情報",
            success: false,
          },
          status: 400,
        },
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("詳細なエラー情報")
    })

    it("response.data.messageが文字列でない場合はデフォルトメッセージを返す", () => {
      const axiosError = {
        response: {
          data: {
            message: 123, // 数値
          },
        },
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("エラーが発生しました")
    })

    it("response.dataがない場合はデフォルトメッセージを返す", () => {
      const axiosError = {
        response: {},
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("エラーが発生しました")
    })

    it("responseがない場合はデフォルトメッセージを返す", () => {
      const axiosError = {
        config: {},
        request: {},
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("エラーが発生しました")
    })
  })

  describe("Error オブジェクト", () => {
    it("Error オブジェクトのmessageを返す", () => {
      const error = new Error("標準エラーメッセージ")

      const result = getApiErrorMessage(error)
      expect(result).toBe("標準エラーメッセージ")
    })

    it("TypeError のmessageを返す", () => {
      const error = new TypeError("型エラー")

      const result = getApiErrorMessage(error)
      expect(result).toBe("型エラー")
    })

    it("カスタムErrorクラスのmessageを返す", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = "CustomError"
        }
      }

      const error = new CustomError("カスタムエラー")

      const result = getApiErrorMessage(error)
      expect(result).toBe("カスタムエラー")
    })

    it("空のmessageでもErrorとして処理される", () => {
      const error = new Error("")

      const result = getApiErrorMessage(error)
      expect(result).toBe("")
    })
  })

  describe("文字列", () => {
    it("文字列をそのまま返す", () => {
      const result = getApiErrorMessage("文字列エラー")
      expect(result).toBe("文字列エラー")
    })

    it("空文字列をそのまま返す", () => {
      const result = getApiErrorMessage("")
      expect(result).toBe("")
    })

    it("日本語文字列を正しく処理する", () => {
      const result = getApiErrorMessage("ネットワークエラーが発生しました")
      expect(result).toBe("ネットワークエラーが発生しました")
    })
  })

  describe("その他の型", () => {
    it("nullはデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage(null)
      expect(result).toBe("エラーが発生しました")
    })

    it("undefinedはデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage(undefined)
      expect(result).toBe("エラーが発生しました")
    })

    it("数値はデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage(404)
      expect(result).toBe("エラーが発生しました")
    })

    it("booleanはデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage(false)
      expect(result).toBe("エラーが発生しました")
    })

    it("配列はデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage(["error"])
      expect(result).toBe("エラーが発生しました")
    })

    it("空オブジェクトはデフォルトメッセージを返す", () => {
      const result = getApiErrorMessage({})
      expect(result).toBe("エラーが発生しました")
    })
  })

  describe("デフォルトメッセージのカスタマイズ", () => {
    it("カスタムデフォルトメッセージを使用できる", () => {
      const result = getApiErrorMessage(null, "カスタムエラー")
      expect(result).toBe("カスタムエラー")
    })

    it("Axios error以外でカスタムデフォルトメッセージを使用", () => {
      const result = getApiErrorMessage({ invalid: "object" }, "処理に失敗しました")
      expect(result).toBe("処理に失敗しました")
    })

    it("空文字列のカスタムデフォルトメッセージ", () => {
      const result = getApiErrorMessage(null, "")
      expect(result).toBe("")
    })
  })

  describe("エッジケース", () => {
    it("response.data.messageがnullの場合", () => {
      const axiosError = {
        response: {
          data: {
            message: null,
          },
        },
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("エラーが発生しました")
    })

    it("response.dataが配列の場合", () => {
      const axiosError = {
        response: {
          data: [],
        },
      }

      const result = getApiErrorMessage(axiosError)
      expect(result).toBe("エラーが発生しました")
    })

    it("複雑なネストされたオブジェクト", () => {
      const complexError = {
        response: {
          data: {
            error: {
              message: "これは使われない",
            },
            message: "正しいメッセージ",
          },
        },
      }

      const result = getApiErrorMessage(complexError)
      expect(result).toBe("正しいメッセージ")
    })

    it("Errorとresponseプロパティがあるハイブリッドケース", () => {
      class AxiosError extends Error {
        response = {
          data: {
            message: "Axios エラー",
          },
        }

        constructor(message: string) {
          super(message)
        }
      }

      const error = new AxiosError("一般エラー")

      // Axiosエラーが優先される
      const result = getApiErrorMessage(error)
      expect(result).toBe("Axios エラー")
    })
  })
})
