/**
 * CSV形式のURLを検証するユーティリティ
 */

// テンプレートCSVの期待されるヘッダー
const EXPECTED_HEADERS = [
  "",
  "vs_miku",
  "vs_rin",
  "vs_len",
  "vs_luka",
  "vs_meiko",
  "vs_kaito",
  "leoneed_ichica",
  "leoneed_saki",
  "leoneed_honami",
  "leoneed_shiho",
  "mmj_minori",
  "mmj_haruka",
  "mmj_airi",
  "mmj_shizuku",
  "vbs_kohane",
  "vbs_an",
  "vbs_akito",
  "vbs_toya",
  "ws_tsukasa",
  "ws_emu",
  "ws_nene",
  "ws_rui",
  "oclock_kanade",
  "oclock_mafuyu",
  "oclock_ena",
  "oclock_mizuki",
]

export interface CsvValidationResult {
  error?: string
  success: boolean
}

/**
 * URLがCSV形式でアクセス可能か、フォーマットが正しいかを検証
 */
export async function validateCsvUrl(url: string): Promise<CsvValidationResult> {
  try {
    // URLからCSVを取得
    const response = await fetch(url, {
      headers: {
        Accept: "text/csv,text/plain",
      },
    })

    if (!response.ok) {
      return {
        error: `URLにアクセスできません (ステータス: ${response.status})`,
        success: false,
      }
    }

    // Content-Typeをチェック
    const contentType = response.headers.get("content-type")
    if (contentType && !contentType.includes("text/csv") && !contentType.includes("text/plain")) {
      return {
        error:
          "URLがCSV形式ではありません。Googleスプレッドシートを「カンマ区切り形式(.csv)」で公開してください。",
        success: false,
      }
    }

    // CSVの内容を取得
    const csvText = await response.text()

    if (!csvText || csvText.trim() === "") {
      return {
        error: "CSVファイルが空です",
        success: false,
      }
    }

    // 最初の行（ヘッダー）を取得
    const lines = csvText.split(/\r?\n/)
    if (lines.length === 0) {
      return {
        error: "CSVファイルにヘッダー行がありません",
        success: false,
      }
    }

    // ヘッダーを解析
    const headerLine = lines[0]
    const headers = headerLine.split(",").map((h) => h.trim())

    // ヘッダーの数をチェック
    if (headers.length !== EXPECTED_HEADERS.length) {
      return {
        error: `CSVのカラム数が正しくありません。期待: ${EXPECTED_HEADERS.length}列、実際: ${headers.length}列`,
        success: false,
      }
    }

    // ヘッダーの内容をチェック（1列目はスキップ）
    for (let i = 1; i < EXPECTED_HEADERS.length; i++) {
      if (headers[i] !== EXPECTED_HEADERS[i]) {
        return {
          error: `CSVのフォーマットがテンプレートと一致しません。${i + 1}列目: 期待「${EXPECTED_HEADERS[i] || "(空)"}」、実際「${headers[i] || "(空)"}」`,
          success: false,
        }
      }
    }

    // データ行のチェック（最低1行のデータが必要）
    if (lines.length < 2) {
      return {
        error: "CSVファイルにデータ行がありません",
        success: false,
      }
    }

    // データ行の検証（空行を除外）
    const dataLines = lines.slice(1).filter((line) => line.trim() !== "")

    if (dataLines.length === 0) {
      return {
        error: "CSVファイルにデータ行がありません",
        success: false,
      }
    }

    // 各データ行を検証
    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2 // ヘッダーを1行目とするので+2
      const line = dataLines[i]
      const columns = line.split(",").map((col) => col.trim())

      // カラム数チェック
      if (columns.length !== EXPECTED_HEADERS.length) {
        return {
          error: `${lineNumber}行目: カラム数が正しくありません。期待: ${EXPECTED_HEADERS.length}列、実際: ${columns.length}列`,
          success: false,
        }
      }

      // 1列目（日付）のチェック
      const dateColumn = columns[0]
      if (!dateColumn) {
        return {
          error: `${lineNumber}行目: 1列目（日付）が空です`,
          success: false,
        }
      }

      // 日付形式のチェック（YYYY/MM/DD または YYYY-MM-DD）
      const datePattern = /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/
      if (!datePattern.test(dateColumn)) {
        return {
          error: `${lineNumber}行目: 1列目の日付形式が正しくありません。「${dateColumn}」は「YYYY/MM/DD」または「YYYY-MM-DD」形式である必要があります`,
          success: false,
        }
      }

      // 2列目以降（数値）のチェック
      for (let j = 1; j < columns.length; j++) {
        const value = columns[j]

        // 空の場合はスキップ（許容）
        if (value === "") {
          continue
        }

        // 数値かどうかチェック
        if (isNaN(Number(value))) {
          return {
            error: `${lineNumber}行目 ${j + 1}列目（${EXPECTED_HEADERS[j]}）: 「${value}」は数値ではありません`,
            success: false,
          }
        }
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      error: `URLの検証中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      success: false,
    }
  }
}
