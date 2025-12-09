import { beforeEach, describe, expect, it, vi } from "vitest"
import { validateCsvUrl } from "./csv-validator"

describe("validateCsvUrl", () => {
  const validHeaders =
    ",vs_miku,vs_rin,vs_len,vs_luka,vs_meiko,vs_kaito,leoneed_ichica,leoneed_saki,leoneed_honami,leoneed_shiho,mmj_minori,mmj_haruka,mmj_airi,mmj_shizuku,vbs_kohane,vbs_an,vbs_akito,vbs_toya,ws_tsukasa,ws_emu,ws_nene,ws_rui,oclock_kanade,oclock_mafuyu,oclock_ena,oclock_mizuki"

  const validDataRow =
    "2024/01/01,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600"

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe("正常系", () => {
    it("有効なCSVの場合はsuccess=trueを返す", async () => {
      const validCsv = `${validHeaders}\n${validDataRow}`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => validCsv,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("複数のデータ行がある場合も検証できる", async () => {
      const validCsv = `${validHeaders}\n${validDataRow}\n2024/01/02,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => validCsv,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(true)
    })

    it("YYYY-MM-DD形式の日付も受け入れる", async () => {
      const csvWithDashDate = `${validHeaders}\n2024-01-01,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => csvWithDashDate,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(true)
    })

    it("数値列が空でも許容する", async () => {
      const csvWithEmptyValues = `${validHeaders}\n2024/01/01,100,,300,,500,600,,,900,1000,,,1300,,,,1700,1800,,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => csvWithEmptyValues,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(true)
    })

    it("text/plain Content-Typeも受け入れる", async () => {
      const validCsv = `${validHeaders}\n${validDataRow}`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/plain",
        },
        ok: true,
        text: async () => validCsv,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(true)
    })
  })

  describe("URLアクセスエラー", () => {
    it("URLにアクセスできない場合はエラーを返す", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/notfound.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("URLにアクセスできません (ステータス: 404)")
    })

    it("Content-TypeがCSVでない場合はエラーを返す", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/html",
        },
        ok: true,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("CSV形式ではありません")
    })

    it("fetchが失敗した場合はエラーを返す", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"))

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("URLの検証中にエラーが発生しました")
    })
  })

  describe("CSV内容エラー", () => {
    it("CSVが空の場合はエラーを返す", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => "",
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/empty.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("CSVファイルが空です")
    })

    it("空白行のみの場合は空ファイルとして扱われる", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => "\n\n",
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/noheader.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("CSVファイルが空です")
    })
  })

  describe("ヘッダー検証エラー", () => {
    it("カラム数が少ない場合はエラーを返す", async () => {
      const invalidCsv = ",vs_miku,vs_rin\n2024/01/01,100,200"

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => invalidCsv,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("カラム数が正しくありません")
      expect(result.error).toContain("期待: 27列、実際: 3列")
    })

    it("カラム数が多い場合はエラーを返す", async () => {
      const tooManyColumns = `${validHeaders},extra_column\n${validDataRow},999`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => tooManyColumns,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("カラム数が正しくありません")
      expect(result.error).toContain("期待: 27列、実際: 28列")
    })

    it("ヘッダー名が不正な場合はエラーを返す", async () => {
      const invalidHeader =
        ",vs_miku,wrong_name,vs_len,vs_luka,vs_meiko,vs_kaito,leoneed_ichica,leoneed_saki,leoneed_honami,leoneed_shiho,mmj_minori,mmj_haruka,mmj_airi,mmj_shizuku,vbs_kohane,vbs_an,vbs_akito,vbs_toya,ws_tsukasa,ws_emu,ws_nene,ws_rui,oclock_kanade,oclock_mafuyu,oclock_ena,oclock_mizuki"

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => `${invalidHeader}\n${validDataRow}`,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("フォーマットがテンプレートと一致しません")
      expect(result.error).toContain("3列目: 期待「vs_rin」、実際「wrong_name」")
    })
  })

  describe("データ行検証エラー", () => {
    it("データ行がない場合はエラーを返す", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => validHeaders,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("CSVファイルにデータ行がありません")
    })

    it("空行のみの場合はエラーを返す", async () => {
      const csvWithEmptyLines = `${validHeaders}\n\n\n`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => csvWithEmptyLines,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("CSVファイルにデータ行がありません")
    })

    it("データ行のカラム数が不正な場合はエラーを返す", async () => {
      const invalidDataRow = `${validHeaders}\n2024/01/01,100,200`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => invalidDataRow,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("2行目: カラム数が正しくありません")
      expect(result.error).toContain("期待: 27列、実際: 3列")
    })

    it("1列目（日付）が空の場合はエラーを返す", async () => {
      const emptyDate = `${validHeaders}\n,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => emptyDate,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toBe("2行目: 1列目（日付）が空です")
    })

    it("日付形式が不正な場合はエラーを返す", async () => {
      const invalidDate = `${validHeaders}\n01/01/2024,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => invalidDate,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("2行目: 1列目の日付形式が正しくありません")
      expect(result.error).toContain(
        "「01/01/2024」は「YYYY/MM/DD」または「YYYY-MM-DD」形式である必要があります"
      )
    })

    it("数値列に文字列が含まれる場合はエラーを返す", async () => {
      const invalidNumber = `${validHeaders}\n2024/01/01,100,abc,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => invalidNumber,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("2行目 3列目（vs_rin）")
      expect(result.error).toContain("「abc」は数値ではありません")
    })

    it("複数行の中で不正な行を検出できる", async () => {
      const multipleRows = `${validHeaders}\n${validDataRow}\n2024/01/02,invalid,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600`

      vi.mocked(global.fetch).mockResolvedValue({
        headers: {
          get: () => "text/csv",
        },
        ok: true,
        text: async () => multipleRows,
      } as unknown as Response)

      const result = await validateCsvUrl("https://example.com/sheet.csv")

      expect(result.success).toBe(false)
      expect(result.error).toContain("3行目")
      expect(result.error).toContain("「invalid」は数値ではありません")
    })
  })
})
