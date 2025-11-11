/**
 * APIエラーからエラーメッセージを抽出する
 */
export function getApiErrorMessage(
  error: unknown,
  defaultMessage = "エラーが発生しました"
): string {
  // Axios error の場合
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }

  // Error オブジェクトの場合
  if (error instanceof Error) {
    return error.message
  }

  // 文字列の場合
  if (typeof error === "string") {
    return error
  }

  return defaultMessage
}
