import type { CurrentUserResponse } from "@/types/user"

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  try {
    const res = await fetch(`/api/users/me`, {
      credentials: "include",
      method: "GET",
    })

    if (!res.ok) {
      throw new Error(`APIエラー: ${res.status}`)
    }

    const json = (await res.json()) as CurrentUserResponse
    return json
  } catch {
    return {
      message: "ユーザー情報の取得に失敗しました",
      success: false,
    }
  }
}
