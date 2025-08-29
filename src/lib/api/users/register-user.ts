import { BASE_URL } from "@/constants/common"
import type { ApiResponse } from "@/types/common"

export async function registerUser(idToken: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const json = (await res.json()) as ApiResponse

    if (!res.ok) {
      return {
        message: json.message || `APIエラー: ${res.status}`,
        success: false,
      }
    }

    return json
  } catch (error: unknown) {
    let message = "ユーザー登録に失敗しました"
    if (error instanceof Error) {
      message = error.message
    }
    return {
      message,
      success: false,
    }
  }
}
